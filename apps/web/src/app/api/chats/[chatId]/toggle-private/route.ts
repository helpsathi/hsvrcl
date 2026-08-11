import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ chatId: string }> }) {
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
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (chatSession.studentId !== session.userId && chatSession.mentorId !== session.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (chatSession.status !== "ACTIVE") {
      return NextResponse.json({ error: "Can only toggle private mode on active sessions" }, { status: 400 });
    }

    const updated = await prisma.chatSession.update({
      where: { id: chatId },
      data: { isPrivate: !chatSession.isPrivate },
    });

    return NextResponse.json({ success: true, isPrivate: updated.isPrivate });
  } catch (error: any) {
    console.error("Toggle Private Chat Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
