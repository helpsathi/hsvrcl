import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchNotification } from "@/lib/notifications";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const internalSecret = req.headers.get("x-internal-secret");
  const isInternal = !!process.env.INTERNAL_API_SECRET && internalSecret === process.env.INTERNAL_API_SECRET;
  const isCron = !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`;

  if (!isCron && !isInternal && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const pendingMessages = await prisma.scheduledMessage.findMany({
      where: {
        status: "PENDING",
        scheduledAt: { lte: new Date() }
      }
    });

    let processedCount = 0;

    for (const msg of pendingMessages) {
      try {
        let studentIds: string[] = [];
        
        // Find mentorProfile id to lookup subscriptions
        const mentorProfile = await prisma.mentorProfile.findUnique({
          where: { userId: msg.mentorId }
        });

        if (!mentorProfile) {
          throw new Error("Mentor profile not found");
        }

        if (msg.targetAudience === "ALL_SUBSCRIBERS") {
          const subs = await prisma.subscription.findMany({
            where: { mentorId: mentorProfile.id, isActive: true, endDate: { gt: new Date() } },
            select: { studentId: true }
          });
          studentIds = subs.map(s => s.studentId);
        } else if (msg.targetAudience === "ALL_PAST_STUDENTS") {
          const sessions = await prisma.chatSession.findMany({
            where: { mentorId: msg.mentorId },
            select: { studentId: true },
            distinct: ["studentId"]
          });
          studentIds = sessions.map(s => s.studentId);
        } else if (msg.targetAudience === "SPECIFIC") {
          studentIds = msg.targetStudentIds;
        }

        // De-duplicate student IDs just in case
        studentIds = Array.from(new Set(studentIds));

        if (studentIds.length > 0 || msg.targetAudience === "ALL_SUBSCRIBERS" || msg.targetAudience === "ALL_PAST_STUDENTS") {
          await prisma.announcement.create({
            data: {
              mentorId: mentorProfile.id,
              title: "Scheduled Mentor Update",
              content: msg.content,
              targetAudience: msg.targetAudience,
            },
          });
        }

        if (studentIds.length > 0) {
          const BATCH_SIZE = 50;
          for (let i = 0; i < studentIds.length; i += BATCH_SIZE) {
            const batch = studentIds.slice(i, i + BATCH_SIZE);
            await Promise.all(
              batch.map((studentId) =>
                dispatchNotification({
                  userId: studentId,
                  title: "📢 New Announcement from Mentor",
                  message: msg.content.substring(0, 100) + (msg.content.length > 100 ? "..." : ""),
                  type: "ANNOUNCEMENT",
                  link: `/announcements`,
                })
              )
            );
          }
        }

        // Mark as sent
        await prisma.scheduledMessage.update({
          where: { id: msg.id },
          data: { status: "SENT" }
        });
        processedCount++;

      } catch (err) {
        console.error(`Failed to process scheduled message ${msg.id}:`, err);
        // Mark as failed so it doesn't block others indefinitely
        await prisma.scheduledMessage.update({
          where: { id: msg.id },
          data: { status: "FAILED" }
        });
      }
    }

    return NextResponse.json({ success: true, processedCount });
  } catch (error: any) {
    console.error("Cron Scheduled Messages Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
