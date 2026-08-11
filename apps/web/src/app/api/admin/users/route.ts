import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/rbac";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "SUPPORT", "MODERATOR"] });
    if (!session || !auth.authorized) return auth.response || NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role'); // optional filter
    const search = searchParams.get('search')?.trim(); // optional global search
    const page = parseInt(searchParams.get('page') || "1", 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || "50", 10), 100);
    const skip = (Math.max(page, 1) - 1) * limit;

    const whereClause: any = {};
    if (role && role !== "ALL") {
      whereClause.role = role;
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          avatar: true,
          role: true,
          adminSubRole: true,
          isBanned: true,
          isSuspended: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
          mentorProfile: {
            select: {
              id: true,
              status: true,
              commissionRate: true,
              perMinutePrice: true,
              callPricePerMinute: true,
              monthlyPrice: true,
              freeTrial: true,
              subscribedBookingFree: true,
              isOnline: true,
              experience: true,
            }
          },
          wallet: {
            select: {
              id: true,
              balance: true,
              lockedBalance: true,
            }
          }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "").trim().toLowerCase();
    const enrichedUsers = users.map((u) => ({
      ...u,
      isSuperAdmin: Boolean((superAdminEmail && u.email.toLowerCase() === superAdminEmail) || u.adminSubRole === "SUPER_ADMIN"),
    }));

    return NextResponse.json({ 
      success: true, 
      users: enrichedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error("Fetch Admin Users Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
