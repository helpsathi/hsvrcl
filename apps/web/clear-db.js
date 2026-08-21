const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting deletion of users and mentors...');
    // TRUNCATE with CASCADE will safely delete all users and any related records in other tables
    // (like MentorProfiles, ChatSessions, Wallets, etc.)
    // It will NOT affect platform_config or coupons as they don't have a foreign key to users.
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" CASCADE;');
    console.log('Successfully cleared all user and mentor data. The database is ready for fresh testing.');
  } catch (error) {
    console.error('Error clearing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
