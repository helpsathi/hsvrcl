import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    
    if (!session || (session.role !== "MENTOR" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized. Only mentors can update meeting links." }, { status: 401 });
    }

    const body = await req.json();
    const { meetLink } = body;

    if (!meetLink) {
      return NextResponse.json({ error: "Missing meeting link" }, { status: 400 });
    }

    let formattedLink = meetLink;
    if (!/^https?:\/\//i.test(formattedLink)) {
      formattedLink = `https://${formattedLink}`;
    }

    const meeting = await prisma.groupMeeting.findUnique({
      where: { id }
    });

    if (!meeting) {
      return NextResponse.json({ error: "Group meeting not found" }, { status: 404 });
    }

    if (session.role === "MENTOR" && meeting.mentorId !== session.userId) {
      return NextResponse.json({ error: "Forbidden. This is not your group meeting." }, { status: 403 });
    }

    const updatedMeeting = await prisma.groupMeeting.update({
      where: { id },
      data: { meetLink: formattedLink }
    });

    return NextResponse.json({ success: true, meeting: updatedMeeting });
  } catch (error: any) {
    console.error("Update Meet Link Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
