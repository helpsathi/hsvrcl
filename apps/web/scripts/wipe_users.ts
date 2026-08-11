import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting fresh wipe of all user data...');

  try {
    // Delete all related records first to respect foreign keys
    await prisma.message.deleteMany({});
    console.log('Deleted all Messages');

    await prisma.chatSession.deleteMany({});
    console.log('Deleted all ChatSessions');

    await prisma.review.deleteMany({});
    console.log('Deleted all Reviews');

    await prisma.subscription.deleteMany({});
    console.log('Deleted all Subscriptions');

    await prisma.transaction.deleteMany({});
    console.log('Deleted all Transactions');

    await prisma.wallet.deleteMany({});
    console.log('Deleted all Wallets');

    await prisma.groupMeetingAttendee.deleteMany({});
    console.log('Deleted all Group Meeting Attendees');

    await prisma.groupMeeting.deleteMany({});
    console.log('Deleted all Group Meetings');

    await prisma.communityComment.deleteMany({});
    console.log('Deleted all Community Comments');

    await prisma.communityPost.deleteMany({});
    console.log('Deleted all Community Posts');

    await prisma.mentorProfile.deleteMany({});
    console.log('Deleted all MentorProfiles');

    await prisma.notification.deleteMany({});
    console.log('Deleted all Notifications');

    await prisma.auditLog.deleteMany({});
    console.log('Deleted all AuditLogs');

    await prisma.payment.deleteMany({});
    console.log('Deleted all Payments');

    await prisma.withdrawalRequest.deleteMany({});
    console.log('Deleted all Withdrawal Requests');

    await prisma.scheduledChat.deleteMany({});
    console.log('Deleted all Scheduled Chats');

    // Finally delete the users
    await prisma.user.deleteMany({});
    console.log('Deleted all Users');

    console.log('Successfully wiped all user data. Fresh start ready!');
  } catch (error) {
    console.error('Error wiping data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
