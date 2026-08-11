import fs from 'fs';
import path from 'path';
import { PrismaClient } from "@prisma/client";
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

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
  const allUsers = await prisma.user.findMany({ select: { id: true, role: true, adminSubRole: true, email: true }});
  console.log("Users in DB:");
  console.table(allUsers);
}

main().catch(console.error).finally(() => prisma.$disconnect());
