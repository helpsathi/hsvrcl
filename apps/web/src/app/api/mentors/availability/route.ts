import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrSyncMentorAvailability, syncMentorAvailability } from "@/lib/mentor-availability";

// GET: fetch mentor's own availability slots
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "MENTOR" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.userId },
    });
    if (!mentorProfile) {
      return NextResponse.json({ success: true, slots: [] });
    }

    const slots = await getOrSyncMentorAvailability(prisma, mentorProfile);

    return NextResponse.json({ success: true, slots });
  } catch (error: any) {
    console.error("GET Availability Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST: add or replace all availability slots for a mentor
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "MENTOR" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slots } = await req.json();

    if (!Array.isArray(slots)) {
      return NextResponse.json({ error: "slots must be an array" }, { status: 400 });
    }

    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: session.userId },
    });
    if (!mentorProfile) {
      return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });
    }

    // Validate slots
    for (const slot of slots) {
      if (
        slot.dayOfWeek < 0 || slot.dayOfWeek > 6 ||
        slot.startHour < 0 || slot.startHour > 23 ||
        slot.endHour < 0 || slot.endHour > 23 ||
        (slot.startHour > slot.endHour) ||
        (slot.startHour === slot.endHour && slot.startMin >= slot.endMin)
      ) {
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return NextResponse.json({ 
          error: `End time must be after start time for ${days[slot.dayOfWeek]}.` 
        }, { status: 400 });
      }
    }

    // Replace all existing slots atomically and update profile JSON
    await prisma.$transaction(async (tx) => {
      await syncMentorAvailability(tx, mentorProfile.id, slots);
      await tx.mentorProfile.update({
        where: { id: mentorProfile.id },
        data: { availability: slots },
      });
    });

    const newSlots = await prisma.mentorAvailability.findMany({
      where: { mentorId: mentorProfile.id, isActive: true },
      orderBy: [{ dayOfWeek: "asc" }, { startHour: "asc" }],
    });

    return NextResponse.json({ success: true, slots: newSlots });
  } catch (error: any) {
    console.error("POST Availability Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

