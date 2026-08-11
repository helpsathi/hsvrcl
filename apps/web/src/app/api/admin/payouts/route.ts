import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/rbac";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const authCheck = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "SUPPORT"] });
    if (!authCheck.authorized) {
      return authCheck.response!;
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "15", 10), 100);
    const statusParam = searchParams.get("status");
    const status = statusParam && statusParam !== "ALL" ? (statusParam as any) : undefined;
    const skip = (Math.max(page, 1) - 1) * limit;

    const whereClause = status ? { status } : {};

    const [payouts, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.withdrawalRequest.count({
        where: whereClause,
      }),
    ]);
    
    // Fetch mentor profiles manually
    const mentorIds = payouts.map(p => p.mentorId);
    
    const mentors = await prisma.mentorProfile.findMany({
      where: { id: { in: mentorIds } },
      select: {
        id: true,
        upiId: true,
        bankDetails: true,
        user: { select: { name: true, email: true, avatar: true } }
      }
    });
    
    const mentorMap = new Map();
    mentors.forEach(m => mentorMap.set(m.id, m));
    
    const formattedPayouts = payouts.map(p => {
      const mentor = mentorMap.get(p.mentorId);
      return {
        id: p.id,
        amount: p.amount,
        status: p.status,
        upiId: p.upiId || mentor?.upiId || null,
        bankDetails: mentor?.bankDetails || null,
        adminNotes: p.adminNotes,
        createdAt: p.createdAt,
        mentor: mentor ? {
          name: mentor.user.name,
          email: mentor.user.email,
          avatar: mentor.user.avatar,
        } : null
      };
    });

    return NextResponse.json({ 
      success: true, 
      payouts: formattedPayouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error("Fetch Admin Payouts Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
