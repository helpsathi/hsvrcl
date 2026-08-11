import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/rbac";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const authCheck = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "SUPPORT", "MODERATOR"] });
    if (!authCheck.authorized) {
      return authCheck.response!;
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    // Single session details with transcript
    if (sessionId) {
      const chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: {
          student: { select: { id: true, name: true, email: true, avatar: true } },
          mentor: { select: { id: true, name: true, email: true, avatar: true } },
          messages: {
            orderBy: { createdAt: "asc" },
            include: {
              sender: { select: { id: true, name: true, role: true, avatar: true } },
            },
          },
        },
      });

      if (!chatSession) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, session: chatSession });
    }

    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "25")));
    const status = searchParams.get("status") || "ALL";
    const search = searchParams.get("search") || "";

    const where: any = {};

    if (status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { student: { name: { contains: search, mode: "insensitive" } } },
        { student: { email: { contains: search, mode: "insensitive" } } },
        { mentor: { name: { contains: search, mode: "insensitive" } } },
        { mentor: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, chatSessions, activeSessions, completedSessions, billedAgg] = await Promise.all([
      prisma.chatSession.count({ where }),
      prisma.chatSession.findMany({
        where,
        include: {
          student: { select: { id: true, name: true, email: true, avatar: true } },
          mentor: { select: { id: true, name: true, email: true, avatar: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.chatSession.count({ where: { status: "ACTIVE" } }),
      prisma.chatSession.count({ where: { status: "COMPLETED" } }),
      prisma.chatSession.aggregate({
        _sum: { totalCharge: true, durationMinutes: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      sessions: chatSessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        activeSessions,
        completedSessions,
        totalRevenue: billedAgg._sum.totalCharge || 0,
        totalMinutes: billedAgg._sum.durationMinutes || 0,
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/chats error:", error);
    return NextResponse.json({ error: "Failed to fetch chat sessions" }, { status: 500 });
  }
}
