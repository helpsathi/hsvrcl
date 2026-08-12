import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;
    const chatSession = await prisma.chatSession.findUnique({
      where: { id: chatId },
    });

    if (!chatSession) {
      return NextResponse.json({ error: "Chat session not found" }, { status: 404 });
    }

    // Only student or mentor in the session can clear the chat
    if (
      session.userId !== chatSession.studentId &&
      session.userId !== chatSession.mentorId &&
      session.role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete all messages associated with the chat session
    await prisma.message.deleteMany({
      where: { sessionId: chatId },
    });

    return NextResponse.json({
      success: true,
      message: "Chat history cleared successfully",
    });
  } catch (error: any) {
    console.error("Clear Chat Error:", error);
    return NextResponse.json({ error: "Failed to clear chat history" }, { status: 500 });
  }
}
