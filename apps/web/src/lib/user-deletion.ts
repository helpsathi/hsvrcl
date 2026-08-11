import { prisma } from "@/lib/prisma";

/**
 * Performs true GDPR/CCPA data erasure and identifier release on a user account.
 * Replaces personally identifiable information (PII) with anonymized placeholders,
 * releases email and Google SSO IDs so the person can register afresh in the future,
 * and cancels active consultations or pending payouts.
 */
export async function performUserAccountDeletion(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.deletedAt !== null) {
    return user;
  }

  const timestamp = Date.now();
  const shortId = userId.slice(0, 8);

  // 1. Cancel upcoming scheduled consultations involving this user
  try {
    await prisma.scheduledChat.updateMany({
      where: {
        OR: [{ studentId: userId }, { mentorId: userId }],
        status: { in: ["PENDING" as any, "CONFIRMED" as any, "RESCHEDULED" as any, "ACCEPTED" as any] },
      },
      data: {
        status: "CANCELLED" as any,
      },
    });
  } catch (e) {
    console.error("Error cancelling scheduled chats during account deletion:", e);
  }

  // 2. Terminate active chat sessions involving this user
  try {
    await prisma.chatSession.updateMany({
      where: {
        OR: [{ studentId: userId }, { mentorId: userId }],
        status: { in: ["PENDING" as any, "ACTIVE" as any] },
      },
      data: {
        status: "CANCELLED" as any,
      },
    });
  } catch (e) {
    console.error("Error cancelling active chat sessions during account deletion:", e);
  }

  // 3. Scrub Mentor Profile and reject pending payouts if user is a mentor
  try {
    const mentorProfile = await prisma.mentorProfile.findUnique({ where: { userId } });
    if (mentorProfile) {
      await prisma.withdrawalRequest.updateMany({
        where: {
          mentorId: mentorProfile.id,
          status: "PENDING" as any,
        },
        data: {
          status: "REJECTED" as any,
          adminNotes: "Account data erased by administrator or user request.",
        },
      });

      await prisma.mentorProfile.update({
        where: { id: mentorProfile.id },
        data: {
          username: `deleted_mentor_${shortId}_${timestamp}`,
          bio: "Account deleted and personal data removed.",
          linkedinUrl: null,
          resumeUrl: null,
          bankDetails: null as any,
          upiId: null,
          status: "REJECTED" as any,
        },
      });
    }
  } catch (e) {
    console.error("Error scrubbing mentor profile during account deletion:", e);
  }

  // 4. Perform data erasure on User record and release credentials for future re-joining
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: "Deleted User",
      email: `deleted_${shortId}_${timestamp}@inactive.helpsathi.local`,
      phone: null,
      avatar: null,
      googleId: null,
      isBanned: false,
      isSuspended: false,
      deletedAt: new Date(),
    },
  });

  return updatedUser;
}
