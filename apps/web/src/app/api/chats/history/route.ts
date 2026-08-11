import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    const whereCond = session.role === "MENTOR" ? { mentorId: session.userId } : { studentId: session.userId };

    if (sessionId) {
      const chat = await prisma.chatSession.findFirst({
        where: {
          id: sessionId,
          ...whereCond,
        },
        include: {
          student: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          mentor: {
            select: { id: true, name: true, email: true, avatar: true },
          },
          messages: {
            orderBy: { createdAt: "asc" },
            include: {
              sender: { select: { id: true, name: true, avatar: true } },
            },
          },
        },
      });

      if (!chat) {
        return NextResponse.json({ error: "Chat session not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, session: chat });
    }

    const chatSessions = await prisma.chatSession.findMany({
      where: whereCond,
      include: {
        student: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        mentor: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      sessions: chatSessions,
    });
  } catch (error: any) {
    console.error("GET /api/chats/history error:", error);
    return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 });
  }
}
