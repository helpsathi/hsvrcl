import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/rbac";
import { dispatchNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] });
    if (!auth.authorized) return auth.response!;

    const { userId, commissionRate } = await req.json();

    const parsedRate = Number(commissionRate);
    if (!userId || isNaN(parsedRate) || parsedRate < 10 || parsedRate > 80) {
      return NextResponse.json({ error: "Invalid parameters. Commission rate must be between 10% and 80%." }, { status: 400 });
    }

    const mentorProfile = await prisma.mentorProfile.upsert({
      where: { userId },
      update: { commissionRate: parsedRate },
      create: {
        userId,
        status: "APPROVED",
        commissionRate: parsedRate,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: session?.userId || null,
        action: "MENTOR_COMMISSION_UPDATE",
        targetId: userId,
        details: JSON.stringify({ commissionRate: parsedRate }),
      },
    });

    // Notify mentor in real time
    await dispatchNotification({
      userId,
      title: "💰 Commission Rate Updated",
      message: `Your platform commission rate has been adjusted to ${parsedRate}%. This will apply to your future bookings and chat sessions.`,
      type: "PAYMENT",
      link: "/mentor-dashboard",
    });

    return NextResponse.json({ success: true, commissionRate: mentorProfile.commissionRate });
  } catch (error: any) {
    console.error("Update Mentor Commission Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

