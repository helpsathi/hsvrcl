import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, DEFAULT_TRANSACTION_OPTIONS } from "@/lib/prisma";
import { dispatchNotification } from "@/lib/notifications";
import { requireAdminPermission } from "@/lib/rbac";
import { formatDatabaseError } from "@/lib/errors";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] });
    if (!auth.authorized) return auth.response!;

    const { userId, status, commissionRate, rejectionReason, freeTrial } = await req.json();

    if (!userId || !["APPROVED", "REJECTED", "SUSPENDED"].includes(status)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    if (status === "APPROVED" && (commissionRate === undefined || commissionRate < 10 || commissionRate > 80)) {
      return NextResponse.json({ error: "Commission rate must be between 10 and 80 when approving a mentor." }, { status: 400 });
    }

    const trimmedReason = rejectionReason?.trim() || "Application details could not be verified.";

    const mentorProfile = await prisma.$transaction(async (tx) => {
      const profile = await tx.mentorProfile.update({
        where: { userId },
        data: { 
          status,
          rejectionReason: status === "REJECTED" ? trimmedReason : null,
          ...(status === "APPROVED" && { 
            commissionRate,
            ...(freeTrial !== undefined && { freeTrial: Boolean(freeTrial) }) 
          })
        },
      });

      if (status === "APPROVED") {
        await tx.user.update({
          where: { id: userId },
          data: { role: "MENTOR" }
        });
      } else if (status === "REJECTED" || status === "SUSPENDED") {
        await tx.user.update({
          where: { id: userId },
          data: { role: "STUDENT" }
        });
      }

      return profile;
    }, DEFAULT_TRANSACTION_OPTIONS);

    await prisma.auditLog.create({
      data: {
        userId: session!.userId,
        action: "MENTOR_STATUS_UPDATE",
        targetId: userId,
        details: JSON.stringify({ status, commissionRate, freeTrial, rejectionReason: trimmedReason }),
      },
    });

    let notifTitle = "🎉 Mentor Profile Approved!";
    let notifMessage = "Congratulations! Your mentor profile is active and you can now receive consultations.";
    let notifLink = "/mentor-dashboard";

    if (status === "REJECTED") {
      notifTitle = "❌ Mentor Application Not Approved";
      notifMessage = `Your application was not approved. Reason: "${trimmedReason}". You may update your information/documents and re-apply immediately!`;
      notifLink = "/onboarding/mentor";
    } else if (status === "SUSPENDED") {
      notifTitle = "⚠️ Mentor Account Suspended";
      notifMessage = "Your mentor account has been suspended. Please contact support.";
      notifLink = "/dashboard";
    }

    await dispatchNotification({
      userId,
      title: notifTitle,
      message: notifMessage,
      type: "ACCOUNT",
      link: notifLink,
    });

    return NextResponse.json({ success: true, mentorProfile });
  } catch (error: any) {
    console.error("Update Mentor Status Error:", error);
    const friendlyMsg = formatDatabaseError(error, "Failed to update mentor status. Please try again.");
    return NextResponse.json({ error: friendlyMsg }, { status: 500 });
  }
}
