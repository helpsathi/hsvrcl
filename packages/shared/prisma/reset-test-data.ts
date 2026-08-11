import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Safely locate and load DATABASE_URL from workspace root .env if not present in process
if (!process.env.DATABASE_URL) {
  const possiblePaths = [
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../../apps/web/.env'),
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
  console.log("🧹 Starting comprehensive test data reset on target database...");

  // 1. Delete dependent transactional and interactive records first to clear foreign key constraints
  await prisma.pushSubscription.deleteMany({});
  await prisma.scheduledMessage.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.sessionProposalAcceptance.deleteMany({});
  await prisma.sessionProposal.deleteMany({});
  await prisma.mentorAvailability.deleteMany({});
  await prisma.groupMeetingAttendee.deleteMany({});
  await prisma.groupMeeting.deleteMany({});
  await prisma.communityComment.deleteMany({});
  await prisma.communityPost.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.couponUsage.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.scheduledChat.deleteMany({});
  await prisma.chatSession.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.withdrawalRequest.deleteMany({});
  await prisma.review.deleteMany({});

  console.log("✅ Cleared all chats, sessions, subscriptions, payments, and activity records.");

  // 2. Delete all MentorProfiles
  await prisma.mentorProfile.deleteMany({});
  console.log("✅ Cleared all mentor profile settings and schedules.");

  // 3. Find all non-admin user IDs (Mentors and Students)
  const nonAdminUsers = await prisma.user.findMany({
    where: { role: { not: 'ADMIN' } },
    select: { id: true }
  });
  const nonAdminIds = nonAdminUsers.map((u: { id: string }) => u.id);

  // 4. Delete Wallets for non-admin users
  await prisma.wallet.deleteMany({
    where: { userId: { in: nonAdminIds } }
  });

  // 5. Delete all non-admin users
  const deletedUsers = await prisma.user.deleteMany({
    where: { role: { not: 'ADMIN' } }
  });

  console.log(`✅ Successfully deleted ${deletedUsers.count} non-admin users (Mentors & Students).`);
  console.log("✨ Test environment reset complete! Admin accounts, coupons, and Platform Configurations remain untouched.");
}

main()
  .catch((e) => {
    console.error("Error resetting test data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
