import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "MENTOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.userId },
      include: { user: true }
    });

    if (!mentorProfile) {
      return NextResponse.json({ error: "Mentor profile not found" }, { status: 403 });
    }

    // Get all subscribers
    const subscriptions = await prisma.subscription.findMany({
      where: { mentorId: mentorProfile.id },
      include: { student: { select: { id: true, name: true, email: true, avatar: true } } }
    });

    // Get all past chat sessions
    const chatSessions = await prisma.chatSession.findMany({
      where: { mentorId: mentorProfile.user.id },
      include: { student: { select: { id: true, name: true, email: true, avatar: true } } }
    });

    const studentsMap = new Map();

    subscriptions.forEach(sub => {
      studentsMap.set(sub.student.id, {
        id: sub.student.id,
        name: sub.student.name,
        email: sub.student.email,
        avatar: sub.student.avatar,
        isActiveSubscriber: sub.isActive
      });
    });

    chatSessions.forEach(session => {
      if (!studentsMap.has(session.student.id)) {
        studentsMap.set(session.student.id, {
          id: session.student.id,
          name: session.student.name,
          email: session.student.email,
          avatar: session.student.avatar,
          isActiveSubscriber: false
        });
      }
    });

    const students = Array.from(studentsMap.values());

    return NextResponse.json({ success: true, students });
  } catch (error: any) {
    console.error("Fetch Mentor Students Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
