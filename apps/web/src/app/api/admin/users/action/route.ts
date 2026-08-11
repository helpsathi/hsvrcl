import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dispatchNotification } from "@/lib/notifications";
import { requireAdminPermission } from "@/lib/rbac";
import { performUserAccountDeletion } from "@/lib/user-deletion";
import { formatDatabaseError } from "@/lib/errors";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] });
    if (!session || !auth.authorized) return auth.response || NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { userId, action, reason } = await req.json();

    if (!userId || !["BAN", "UNBAN", "SUSPEND", "UNSUSPEND", "DELETE", "RESTORE"].includes(action)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    if (action === "DELETE" && session?.adminSubRole === "MODERATOR") {
      return NextResponse.json({ error: "Forbidden: Moderators cannot delete user accounts" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "").trim().toLowerCase();
    const isTargetSuperAdmin = Boolean(
      (superAdminEmail && user.email.toLowerCase() === superAdminEmail) || 
      user.adminSubRole === "SUPER_ADMIN"
    );

    if (isTargetSuperAdmin && ["BAN", "SUSPEND", "DELETE"].includes(action)) {
      return NextResponse.json(
        { error: "Forbidden: The system Super Admin account is permanently protected and cannot be banned, suspended, or deleted." },
        { status: 403 }
      );
    }

    let data: any = {};
    let notifTitle = "";
    let notifMessage = "";

    switch (action) {
      case "BAN":
        data = { isBanned: true };
        notifTitle = "🚫 Account Banned";
        notifMessage = `Your account has been banned due to policy violation.${reason ? ` Reason: ${reason}` : ""}`;
        break;
      case "UNBAN":
        data = { isBanned: false };
        notifTitle = "✅ Account Restored";
        notifMessage = "Your account ban has been lifted.";
        break;
      case "SUSPEND":
        data = { isSuspended: true };
        notifTitle = "⚠️ Account Suspended";
        notifMessage = `Your account has been temporarily suspended.${reason ? ` Reason: ${reason}` : ""}`;
        break;
      case "UNSUSPEND":
        data = { isSuspended: false };
        notifTitle = "🎉 Suspension Lifted";
        notifMessage = "Your account suspension has been resolved.";
        break;
      case "DELETE":
        break;
      case "RESTORE":
        if (user.deletedAt || user.email.startsWith("deleted_")) {
          return NextResponse.json({ error: "Cannot restore account: personal data and credentials were erased during account deletion." }, { status: 400 });
        }
        data = { isBanned: false, isSuspended: false };
        break;
    }

    let updated: any;
    if (action === "DELETE") {
      updated = await performUserAccountDeletion(userId);
    } else {
      updated = await prisma.user.update({
        where: { id: userId },
        data,
      });
    }

    // Create Audit Log entry
    try {
      await prisma.auditLog.create({
        data: {
          userId: session.userId,
          action: `USER_${action}`,
          targetId: userId,
          details: reason ? String(reason).trim() : `Performed ${action} on user ${user.email}`,
        },
      });
    } catch (e) {
      console.error("Failed to write user moderation audit log:", e);
    }

    // Send notification if not deleted
    if (notifTitle && action !== "DELETE") {
      await dispatchNotification({
        userId,
        title: notifTitle,
        message: notifMessage,
        type: "ACCOUNT",
        link: "/dashboard",
      });
    }

    return NextResponse.json({ success: true, message: `User ${action.toLowerCase()}ed successfully`, user: updated });
  } catch (error: any) {
    console.error("User Moderation Action Error:", error);
    const friendlyMsg = formatDatabaseError(error, "Failed to perform user moderation action. Please try again.");
    return NextResponse.json({ error: friendlyMsg }, { status: 500 });
  }
}
