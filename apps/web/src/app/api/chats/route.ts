import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, role } = session;

    let chatSessions = [];

    if (role === "STUDENT") {
      chatSessions = await prisma.chatSession.findMany({
        where: { studentId: userId, mentor: { deletedAt: null } },
        include: {
          mentor: {
            select: { name: true, avatar: true },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, content: true, senderId: true, createdAt: true },
          },
          _count: {
            select: {
              messages: {
                where: { isRead: false, senderId: { not: userId } },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });
    } else {
      chatSessions = await prisma.chatSession.findMany({
        where: { mentorId: userId, student: { deletedAt: null } },
        include: {
          student: {
            select: { name: true, avatar: true },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { id: true, content: true, senderId: true, createdAt: true },
          },
          _count: {
            select: {
              messages: {
                where: { isRead: false, senderId: { not: userId } },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      });
    }

    // Format response
    const formattedSessions = chatSessions.map((chat: any) => {
      const otherUser = role === "STUDENT" ? chat.mentor : chat.student;
      const latestMsg = chat.messages[0];
      let lastMessage = latestMsg?.content;
      
      if (!lastMessage) {
        if (chat.durationMinutes > 0 || chat.status === "COMPLETED" || chat.status === "EXPIRED") {
          const sessionDate = new Date(chat.endTime || chat.createdAt);
          const dateStr = sessionDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: sessionDate.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
          });
          lastMessage = `Chatted ${chat.durationMinutes || 0} mins on ${dateStr}`;
        } else {
          lastMessage = "No messages yet";
        }
      }

      return {
        id: chat.id,
        otherUser: { ...otherUser, id: role === "STUDENT" ? chat.mentorId : chat.studentId },
        lastMessage,
        lastMessageSenderId: latestMsg?.senderId,
        hasUnread: Boolean(latestMsg && latestMsg.senderId !== userId && chat.status === "ACTIVE"),
        unreadCount: chat._count?.messages || 0,
        updatedAt: chat.updatedAt,
        status: chat.status,
        durationMinutes: chat.durationMinutes,
        totalCharge: chat.totalCharge,
      };
    });

    const uniqueChatsMap = new Map();
    for (const chat of formattedSessions) {
      const otherUserId = chat.otherUser.id;
      if (!uniqueChatsMap.has(otherUserId)) {
        uniqueChatsMap.set(otherUserId, chat);
      } else {
        const existing = uniqueChatsMap.get(otherUserId);
        if (new Date(chat.updatedAt) > new Date(existing.updatedAt)) {
          uniqueChatsMap.set(otherUserId, chat);
        }
      }
    }
    
    const uniqueChats = Array.from(uniqueChatsMap.values()).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return NextResponse.json({ success: true, chats: uniqueChats });
  } catch (error: any) {
    console.error("Fetch Chats Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
