import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrSyncMentorAvailability } from "@/lib/mentor-availability";

// GET: returns a mentor's public availability slots (used by the student booking page)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params; // id = mentorProfile.id

    const mentorProfile = await prisma.mentorProfile.findFirst({
      where: {
        OR: [
          { id },
          { userId: id },
        ],
      },
    });
    if (!mentorProfile || mentorProfile.status !== "APPROVED") {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    const slots = await getOrSyncMentorAvailability(prisma, mentorProfile);

    return NextResponse.json({
      success: true,
      slots,
      subscribedBookingFree: mentorProfile.subscribedBookingFree ?? true,
    });
  } catch (error: any) {
    console.error("GET Public Availability Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

