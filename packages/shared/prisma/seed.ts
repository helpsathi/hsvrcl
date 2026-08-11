import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

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

const DEFAULT_CONFIGS: Record<string, { value: string; description: string; type: string }> = {
  platform_commission_rate: {
    value: '20',
    description: 'Platform commission percentage deducted from mentor chat & subscription earnings',
    type: 'number',
  },
  min_wallet_recharge: {
    value: '100',
    description: 'Minimum wallet recharge amount in INR',
    type: 'number',
  },
  min_withdrawal_amount: {
    value: '500',
    description: 'Minimum amount required for mentor withdrawal request in INR',
    type: 'number',
  },
  max_withdrawal_requests: {
    value: '3',
    description: 'Maximum pending withdrawal requests allowed per mentor',
    type: 'number',
  },
  free_trial_max_chats: {
    value: '3',
    description: 'Maximum free trial chats allowed per new student',
    type: 'number',
  },
  free_trial_max_minutes: {
    value: '5',
    description: 'Maximum free trial minutes per chat session',
    type: 'number',
  },
  default_monthly_price: {
    value: '1000',
    description: 'Default recommended monthly subscription price for new mentors',
    type: 'number',
  },
  default_per_minute_price: {
    value: '15',
    description: 'Default recommended per-minute chat rate for new mentors',
    type: 'number',
  },
  notifications_enabled: {
    value: 'true',
    description: 'Global system notification status (true/false)',
    type: 'boolean',
  },
  free_trial_enabled: {
    value: 'true',
    description: 'Global free trial offer status for new users',
    type: 'boolean',
  },
  community_enabled: {
    value: 'true',
    description: 'Enable or disable the Community feature platform-wide',
    type: 'boolean',
  },
  DASHBOARD_OFFERS: {
    value: JSON.stringify([
      { id: "default-free-chats", title: "First 3 Chats are Free!", subtitle: "Talk to any expert mentor for up to 5 mins without paying.", gradientFrom: "from-amber-500", gradientTo: "to-orange-600", iconName: "Gift", newUsersOnly: true },
      { id: "default-first-month", title: "Seamless Monthly Mentorship", subtitle: "Subscribe via AutoPay for continuous unlimited support & strategy.", gradientFrom: "from-indigo-600", gradientTo: "to-purple-600", iconName: "Tag", newUsersOnly: false },
      { id: "default-resume-review", title: "1-on-1 Strategy & Mentorship", subtitle: "Book audio or video calls with toppers in your targeted field.", gradientFrom: "from-emerald-500", gradientTo: "to-teal-600", iconName: "FileText", newUsersOnly: false }
    ]),
    description: 'Dynamic promotional offer banners displayed on student dashboard',
    type: 'json',
  },
  DASHBOARD_CATEGORIES: {
    value: JSON.stringify([
      { id: "default-upsc-bpsc", name: "UPSC / BPSC", iconName: "BookOpenText" },
      { id: "default-jee-neet", name: "JEE / NEET", iconName: "Atom" },
      { id: "default-software-engg", name: "Software Engg", iconName: "Code" },
      { id: "default-startup-founder", name: "Startup Founder", iconName: "RocketLaunch" },
      { id: "default-mba", name: "CAT / MBA", iconName: "ChartLineUp" },
      { id: "default-medical", name: "Medical / AIIMS", iconName: "FirstAid" }
    ]),
    description: 'Mentor subject categories displayed on student dashboard',
    type: 'json',
  },
};

async function main() {
  console.log("Starting database seeding...");

  for (const [key, meta] of Object.entries(DEFAULT_CONFIGS)) {
    await prisma.platformConfig.upsert({
      where: { key },
      update: {},
      create: {
        key,
        value: meta.value,
        description: meta.description,
        type: meta.type,
      },
    });
  }
  console.log("Seeded default platform configurations.");

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  if (superAdminEmail) {
    const admin = await prisma.user.upsert({
      where: { email: superAdminEmail },
      update: {
        role: 'ADMIN',
        adminSubRole: 'SUPER_ADMIN',
      },
      create: {
        email: superAdminEmail,
        name: 'Super Admin',
        role: 'ADMIN',
        adminSubRole: 'SUPER_ADMIN',
        profileComplete: true,
      },
    });
    console.log(`Verified super admin account: ${admin.email}`);
  }

  console.log("Database seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error running database seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
