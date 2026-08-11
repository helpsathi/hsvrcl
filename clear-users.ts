import fs from 'fs';
import path from 'path';
import { PrismaClient } from "@prisma/client";
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Safely locate and load DATABASE_URL from workspace root .env if not present in process
if (!process.env.DATABASE_URL) {
  const possiblePaths = [
    path.resolve(__dirname, './apps/web/.env'),
    path.resolve(__dirname, './apps/web/.env.local'),
    path.resolve(__dirname, './.env'),
  ];

  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      envContent.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts[0]?.trim() === 'DATABASE_URL') {
          let val = parts.slice(1).join('=').trim();
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
          process.env.DATABASE_URL = val;
        }
      });
      if (process.env.DATABASE_URL) break;
    }
  }
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting cleanup process...");

  // 1. Identify users to delete (those without adminSubRole)
  const usersToDelete = await prisma.user.findMany({
    where: { adminSubRole: null },
    select: { id: true }
  });

  const userIds = usersToDelete.map(u => u.id);
  console.log(`Found ${userIds.length} non-admin users to delete.`);

  if (userIds.length === 0) {
    console.log("No users to delete. Exiting.");
    return;
  }

  // Find MentorProfiles associated with these users
  const mentorProfilesToDelete = await prisma.mentorProfile.findMany({
    where: { userId: { in: userIds } },
    select: { id: true }
  });
  const mentorProfileIds = mentorProfilesToDelete.map(m => m.id);

  // Find Wallets associated with these users
  const walletsToDelete = await prisma.wallet.findMany({
    where: { userId: { in: userIds } },
    select: { id: true }
  });
  const walletIds = walletsToDelete.map(w => w.id);

  // Find ChatSessions associated with these users (as student or mentor)
  const chatSessionsToDelete = await prisma.chatSession.findMany({
    where: { OR: [{ studentId: { in: userIds } }, { mentorId: { in: userIds } }] },
    select: { id: true }
  });
  const chatSessionIds = chatSessionsToDelete.map(c => c.id);

  console.log("Starting transactions to delete related data...");

  await prisma.$transaction(async (tx) => {
    // 1. Delete Messages
    if (chatSessionIds.length > 0) {
      await tx.message.deleteMany({
        where: { sessionId: { in: chatSessionIds } }
      });
      console.log("- Deleted Messages");
    }

    // 2. Delete Transactions
    if (walletIds.length > 0) {
      await tx.transaction.deleteMany({
        where: { walletId: { in: walletIds } }
      });
      console.log("- Deleted Transactions");
    }

    // 3. Delete Payments
    await tx.payment.deleteMany({
      where: { userId: { in: userIds } }
    });
    console.log("- Deleted Payments");

    // 4. Delete ScheduledMessages
    await tx.scheduledMessage.deleteMany({
      where: { mentorId: { in: userIds } }
    });
    console.log("- Deleted ScheduledMessages");

    // 5. Delete ScheduledChats
    await tx.scheduledChat.deleteMany({
      where: { OR: [{ studentId: { in: userIds } }, { mentorId: { in: userIds } }] }
    });
    console.log("- Deleted ScheduledChats");

    // 6. Delete ChatSessions
    if (chatSessionIds.length > 0) {
      await tx.chatSession.deleteMany({
        where: { id: { in: chatSessionIds } }
      });
      console.log("- Deleted ChatSessions");
    }

    // 7. Delete Subscriptions
    if (mentorProfileIds.length > 0) {
      await tx.subscription.deleteMany({
        where: { OR: [{ studentId: { in: userIds } }, { mentorId: { in: mentorProfileIds } }] }
      });
      console.log("- Deleted Subscriptions");
    }

    // 8. Delete Reviews
    if (mentorProfileIds.length > 0) {
      await tx.review.deleteMany({
        where: { OR: [{ studentId: { in: userIds } }, { mentorId: { in: mentorProfileIds } }] }
      });
      console.log("- Deleted Reviews");
    }

    // 9. Delete GroupMeetingAttendee
    await tx.groupMeetingAttendee.deleteMany({
      where: { userId: { in: userIds } }
    });
    console.log("- Deleted GroupMeetingAttendee");

    // 10. Delete GroupMeeting
    await tx.groupMeeting.deleteMany({
      where: { mentorId: { in: userIds } }
    });
    console.log("- Deleted GroupMeeting");

    // 11. Delete SessionProposalAcceptance
    await tx.sessionProposalAcceptance.deleteMany({
      where: { studentId: { in: userIds } }
    });
    console.log("- Deleted SessionProposalAcceptance");

    // 12. Delete SessionProposal
    if (mentorProfileIds.length > 0) {
      await tx.sessionProposal.deleteMany({
        where: { mentorProfileId: { in: mentorProfileIds } }
      });
      console.log("- Deleted SessionProposal");
    }

    // 13. Delete WithdrawalRequest
    if (mentorProfileIds.length > 0) {
      await tx.withdrawalRequest.deleteMany({
        where: { mentorId: { in: mentorProfileIds } }
      });
      console.log("- Deleted WithdrawalRequest");
    }

    // 14. Delete CommunityComment
    await tx.communityComment.deleteMany({
      where: { authorId: { in: userIds } }
    });
    console.log("- Deleted CommunityComment");

    // 15. Delete CommunityPost
    await tx.communityPost.deleteMany({
      where: { authorId: { in: userIds } }
    });
    console.log("- Deleted CommunityPost");

    // 16. Delete CouponUsage
    await tx.couponUsage.deleteMany({
      where: { userId: { in: userIds } }
    });
    console.log("- Deleted CouponUsage");

    // 17. Delete PushSubscription
    await tx.pushSubscription.deleteMany({
      where: { userId: { in: userIds } }
    });
    console.log("- Deleted PushSubscription");

    // 18. Delete Notification
    await tx.notification.deleteMany({
      where: { userId: { in: userIds } }
    });
    console.log("- Deleted Notification");

    // 19. Delete MentorAvailability
    if (mentorProfileIds.length > 0) {
      await tx.mentorAvailability.deleteMany({
        where: { mentorId: { in: mentorProfileIds } }
      });
      console.log("- Deleted MentorAvailability");
    }

    // 20. Delete Announcement
    if (mentorProfileIds.length > 0) {
      await tx.announcement.deleteMany({
        where: { mentorId: { in: mentorProfileIds } }
      });
      console.log("- Deleted Announcement");
    }

    // 21. Delete MentorProfile
    await tx.mentorProfile.deleteMany({
      where: { userId: { in: userIds } }
    });
    console.log("- Deleted MentorProfile");

    // 22. Delete Wallet
    await tx.wallet.deleteMany({
      where: { userId: { in: userIds } }
    });
    console.log("- Deleted Wallet");
    
    // 23. Delete AuditLogs
    await tx.auditLog.deleteMany({
      where: { userId: { in: userIds } }
    });
    console.log("- Deleted AuditLogs");

    // 24. Delete User
    const deletedUsers = await tx.user.deleteMany({
      where: { id: { in: userIds } }
    });
    console.log(`- Deleted ${deletedUsers.count} Users`);

  }, {
    timeout: 120000 // 120 seconds timeout in case of lots of data
  });

  console.log("Cleanup completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during cleanup:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
