import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, DEFAULT_TRANSACTION_OPTIONS } from "@/lib/prisma";
import { dispatchNotification } from "@/lib/notifications";
import { requireAdminPermission } from "@/lib/rbac";
import { performUserAccountDeletion } from "@/lib/user-deletion";
import { formatDatabaseError } from "@/lib/errors";
import { validatePhoneNumber } from "@/lib/phoneValidation";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "SUPPORT", "MODERATOR"] });
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        mentorProfile: true,
        wallet: true,
        _count: {
          select: {
            studentChatSessions: true,
            mentorChatSessions: true,
            subscriptions: true,
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("GET /api/admin/users/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "MODERATOR"] });
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    const body = await req.json();
    const { 
      action, 
      name, 
      email, 
      phone, 
      role, 
      adminSubRole, 
      isBanned, 
      isSuspended,
      mentorProfile: mentorProfileInput,
      walletAdjustment
    } = body;

    const targetUser = await prisma.user.findUnique({ 
      where: { id },
      include: { mentorProfile: true, wallet: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "").trim().toLowerCase();
    const isTargetSuperAdmin = Boolean(superAdminEmail && targetUser.email.toLowerCase() === superAdminEmail);

    if (isTargetSuperAdmin) {
      if (action === "BAN" || action === "SUSPEND" || isBanned === true || isSuspended === true) {
        return NextResponse.json(
          { error: "Forbidden: The system Super Admin account is permanently protected and cannot be banned or suspended." }, 
          { status: 403 }
        );
      }
      if (role !== undefined && role !== "ADMIN") {
        return NextResponse.json(
          { error: "Forbidden: The system Super Admin account role cannot be demoted." }, 
          { status: 403 }
        );
      }
      if (adminSubRole !== undefined && adminSubRole !== "SUPER_ADMIN") {
        return NextResponse.json(
          { error: "Forbidden: The system Super Admin account sub-role cannot be altered." }, 
          { status: 403 }
        );
      }
    }

    if (targetUser.adminSubRole === "SUPER_ADMIN" && session?.adminSubRole !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden: Only Super Admin can modify another Super Admin" }, { status: 403 });
    }

    const updateUserData: any = {};
    const auditChanges: Record<string, any> = {};

    // 1. Quick Actions (Ban / Suspend / Lift)
    if (action === "BAN") {
      updateUserData.isBanned = true;
      auditChanges.action = "BAN";
    } else if (action === "UNBAN") {
      updateUserData.isBanned = false;
      auditChanges.action = "UNBAN";
    } else if (action === "SUSPEND") {
      updateUserData.isSuspended = true;
      auditChanges.action = "SUSPEND";
    } else if (action === "UNSUSPEND") {
      updateUserData.isSuspended = false;
      auditChanges.action = "UNSUSPEND";
    } else {
      // 2. Profile Details
      if (name !== undefined && name.trim()) {
        updateUserData.name = name.trim();
        auditChanges.name = name.trim();
      }

      if (email !== undefined && email.trim() && email.trim().toLowerCase() !== targetUser.email.toLowerCase()) {
        const emailLower = email.trim().toLowerCase();
        const existing = await prisma.user.findUnique({ where: { email: emailLower } });
        if (existing && existing.id !== id) {
          return NextResponse.json({ error: "Email is already taken by another user" }, { status: 400 });
        }
        updateUserData.email = emailLower;
        auditChanges.email = emailLower;
      }

      if (phone !== undefined) {
        if (phone && phone.trim()) {
          const phoneValidation = validatePhoneNumber(phone);
          if (!phoneValidation.isValid) {
            return NextResponse.json({ error: phoneValidation.error || "Invalid mobile number" }, { status: 400 });
          }
          updateUserData.phone = phoneValidation.cleanPhone;
        } else {
          updateUserData.phone = null;
        }
        auditChanges.phone = updateUserData.phone;
      }

      // 3. Role & Permissions
      if (adminSubRole !== undefined) {
        if ((adminSubRole || null) !== targetUser.adminSubRole) {
          if (session?.adminSubRole !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Forbidden: Only Super Admin can assign or change admin sub-roles" }, { status: 403 });
          }
          updateUserData.adminSubRole = adminSubRole || null;
          auditChanges.adminSubRole = updateUserData.adminSubRole;

          // If granting an admin sub-role, elevate system role to ADMIN
          if (adminSubRole) {
            updateUserData.role = "ADMIN";
            auditChanges.role = "ADMIN";
          } else if (targetUser.role === "ADMIN" && role === undefined) {
            // Revert back to MENTOR if they had a mentor profile, otherwise STUDENT
            updateUserData.role = targetUser.mentorProfile ? "MENTOR" : "STUDENT";
            auditChanges.role = updateUserData.role;
          }
        }
      }

      if (role !== undefined && ["STUDENT", "MENTOR", "ADMIN"].includes(role)) {
        if (!updateUserData.adminSubRole && !targetUser.adminSubRole) {
          updateUserData.role = role;
          auditChanges.role = role;
        } else if (role === "STUDENT" || role === "MENTOR") {
          // If demoting from ADMIN role, clear adminSubRole if caller is Super Admin
          if (session?.adminSubRole === "SUPER_ADMIN") {
            updateUserData.role = role;
            updateUserData.adminSubRole = null;
            auditChanges.role = role;
            auditChanges.adminSubRole = null;
          }
        }
      }

      if (isBanned !== undefined) {
        updateUserData.isBanned = Boolean(isBanned);
        auditChanges.isBanned = Boolean(isBanned);
      }

      if (isSuspended !== undefined) {
        updateUserData.isSuspended = Boolean(isSuspended);
        auditChanges.isSuspended = Boolean(isSuspended);
      }
    }

    // Determine final active role
    const finalRole = updateUserData.role || targetUser.role;

    // 4. Execute User Updates inside transaction with generous timeout for Neon serverless cold starts
    const result = await prisma.$transaction(async (tx) => {
      let updatedUser = targetUser;
      if (Object.keys(updateUserData).length > 0) {
        updatedUser = (await tx.user.update({
          where: { id },
          data: updateUserData,
          include: { mentorProfile: true, wallet: true },
        })) as any;
      }

      // 5. Mentor Profile Customization (Only if user has MENTOR role)
      if (finalRole === "MENTOR" && (mentorProfileInput || updateUserData.role === "MENTOR")) {
        const mp = mentorProfileInput || {};
        const mentorUpdateData: any = {};

        if (mp.bio !== undefined) {
          mentorUpdateData.bio = mp.bio ? String(mp.bio).trim() : null;
          auditChanges.bio = mentorUpdateData.bio;
        }
        if (mp.categories !== undefined && Array.isArray(mp.categories)) {
          mentorUpdateData.categories = mp.categories;
          auditChanges.categories = mp.categories;
        }
        if (mp.skills !== undefined && Array.isArray(mp.skills)) {
          mentorUpdateData.skills = mp.skills;
          auditChanges.skills = mp.skills;
        }
        if (mp.experience !== undefined) {
          mentorUpdateData.experience = Math.max(0, Number(mp.experience) || 0);
          auditChanges.experience = mentorUpdateData.experience;
        }
        if (mp.commissionRate !== undefined && mp.commissionRate !== null) {
          const rate = Number(mp.commissionRate);
          if (rate >= 10 && rate <= 80) {
            mentorUpdateData.commissionRate = rate;
            auditChanges.commissionRate = rate;
          }
        }
        if (mp.status !== undefined && ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"].includes(mp.status)) {
          mentorUpdateData.status = mp.status;
          auditChanges.mentorStatus = mp.status;
        }
        if (mp.perMinutePrice !== undefined) {
          mentorUpdateData.perMinutePrice = Math.max(0, Number(mp.perMinutePrice));
          auditChanges.perMinutePrice = mentorUpdateData.perMinutePrice;
        }
        if (mp.callPricePerMinute !== undefined) {
          mentorUpdateData.callPricePerMinute = Math.max(0, Number(mp.callPricePerMinute));
          auditChanges.callPricePerMinute = mentorUpdateData.callPricePerMinute;
        }
        if (mp.monthlyPrice !== undefined) {
          mentorUpdateData.monthlyPrice = Math.max(0, Number(mp.monthlyPrice));
          auditChanges.monthlyPrice = mentorUpdateData.monthlyPrice;
        }
        if (mp.freeTrial !== undefined) {
          mentorUpdateData.freeTrial = Boolean(mp.freeTrial);
          auditChanges.freeTrial = Boolean(mp.freeTrial);
        }
        if (mp.subscribedBookingFree !== undefined) {
          mentorUpdateData.subscribedBookingFree = Boolean(mp.subscribedBookingFree);
          auditChanges.subscribedBookingFree = Boolean(mp.subscribedBookingFree);
        }

        await tx.mentorProfile.upsert({
          where: { userId: id },
          update: mentorUpdateData,
          create: {
            userId: id,
            status: mentorUpdateData.status || (mentorUpdateData.bio ? "APPROVED" : "PENDING"),
            commissionRate: mentorUpdateData.commissionRate ?? 20,
            perMinutePrice: mentorUpdateData.perMinutePrice ?? 15,
            callPricePerMinute: mentorUpdateData.callPricePerMinute ?? 15,
            monthlyPrice: mentorUpdateData.monthlyPrice ?? 0,
            freeTrial: mentorUpdateData.freeTrial ?? false,
            subscribedBookingFree: mentorUpdateData.subscribedBookingFree ?? true,
            bio: mentorUpdateData.bio ?? null,
            categories: mentorUpdateData.categories ?? [],
            skills: mentorUpdateData.skills ?? [],
            experience: mentorUpdateData.experience ?? 0,
          },
        });
      } else if (finalRole === "STUDENT" && targetUser.mentorProfile && targetUser.mentorProfile.status !== "SUSPENDED") {
        // If switched to student, safely unlist mentor profile
        await tx.mentorProfile.update({
          where: { userId: id },
          data: { status: "SUSPENDED" },
        });
      }

      // 6. Wallet Balance Direct Adjustments
      if (walletAdjustment && typeof walletAdjustment.amount === "number" && walletAdjustment.amount > 0) {
        const adjustAmount = Math.round(walletAdjustment.amount * 100) / 100;
        const adjustType = walletAdjustment.action === "DEBIT" ? "DEBIT" : "CREDIT";
        const note = walletAdjustment.note?.trim() || "Administrative balance adjustment";

        let userWallet = await tx.wallet.findUnique({ where: { userId: id } });
        if (!userWallet) {
          userWallet = await tx.wallet.create({
            data: { userId: id, balance: 0 },
          });
        }

        const newBalance = adjustType === "CREDIT"
          ? userWallet.balance + adjustAmount
          : Math.max(0, userWallet.balance - adjustAmount);

        await tx.wallet.update({
          where: { id: userWallet.id },
          data: { balance: newBalance },
        });

        await tx.transaction.create({
          data: {
            walletId: userWallet.id,
            type: adjustType,
            amount: adjustAmount,
            description: `Admin Adjustment (${adjustType}): ${note}`,
          },
        });

        auditChanges.walletAdjustment = {
          type: adjustType,
          amount: adjustAmount,
          previousBalance: userWallet.balance,
          newBalance,
          note,
        };
      }

      // 7. Re-fetch full updated user with relations
      const freshUser = await tx.user.findUnique({
        where: { id },
        include: {
          mentorProfile: {
            select: {
              id: true,
              status: true,
              commissionRate: true,
              perMinutePrice: true,
              callPricePerMinute: true,
              monthlyPrice: true,
              freeTrial: true,
              subscribedBookingFree: true,
              isOnline: true,
              experience: true,
            },
          },
          wallet: {
            select: {
              id: true,
              balance: true,
              lockedBalance: true,
            },
          },
        },
      });

      return freshUser;
    }, DEFAULT_TRANSACTION_OPTIONS);

    // 8. Log Audit Record
    await prisma.auditLog.create({
      data: {
        userId: session?.userId || null,
        action: `USER_UPDATE_${action || "ADMIN_EDIT"}`,
        targetId: id,
        details: JSON.stringify(auditChanges),
      },
    });

    // 9. Dispatch Real-time Notification Alerts
    if (action === "BAN" || action === "SUSPEND" || updateUserData.isBanned || updateUserData.isSuspended) {
      await dispatchNotification({
        userId: id,
        title: "⚠️ Account Status Alert",
        message: `Your account access has been restricted by an administrator (${action || "status changed"}). Please contact support for assistance.`,
        type: "ACCOUNT",
        link: "/support",
      });
    } else if (walletAdjustment) {
      const typeStr = walletAdjustment.action === "DEBIT" ? "deducted from" : "credited to";
      await dispatchNotification({
        userId: id,
        title: "💳 Wallet Balance Adjusted",
        message: `₹${walletAdjustment.amount} has been ${typeStr} your HelpSathi wallet by administration.`,
        type: "PAYMENT",
        link: "/wallet",
      });
    } else if (action === "UNBAN" || action === "UNSUSPEND" || updateUserData.role || updateUserData.adminSubRole || mentorProfileInput) {
      await dispatchNotification({
        userId: id,
        title: "✨ Account Updated",
        message: `Your HelpSathi profile details and account settings have been updated by an administrator.`,
        type: "ACCOUNT",
        link: "/profile",
      });
    }

    return NextResponse.json({ success: true, user: result });
  } catch (error: any) {
    console.error("PATCH /api/admin/users/[id] error:", error);
    const friendlyMsg = formatDatabaseError(error, "Failed to update user. Please try again.");
    return NextResponse.json({ error: friendlyMsg }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN"] });
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "").trim().toLowerCase();
    const isTargetSuperAdmin = Boolean(
      (superAdminEmail && targetUser.email.toLowerCase() === superAdminEmail) || 
      targetUser.adminSubRole === "SUPER_ADMIN"
    );

    if (isTargetSuperAdmin) {
      return NextResponse.json(
        { error: "Forbidden: The system Super Admin account is permanently protected and cannot be deleted." }, 
        { status: 403 }
      );
    }

    const deletedUser = await performUserAccountDeletion(id);

    await prisma.auditLog.create({
      data: {
        userId: session?.userId || null,
        action: "USER_DELETE",
        targetId: id,
        details: `Soft deleted user ${targetUser.email}`,
      },
    });

    return NextResponse.json({ success: true, message: "User account has been deleted" });
  } catch (error: any) {
    console.error("DELETE /api/admin/users/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
