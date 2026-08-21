const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const envPaths = [
  path.resolve(__dirname, 'apps/web/.env.local'),
  path.resolve(__dirname, 'apps/web/.env')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts[0]?.trim() === 'DATABASE_URL') {
        let val = parts.slice(1).join('=').trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        if (!process.env.DATABASE_URL) {
          process.env.DATABASE_URL = val;
        }
      }
    });
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("No DATABASE_URL found.");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log("Starting a fresh wipe of all users and related data (excluding platform config)...");
    
    // Using TRUNCATE with CASCADE is the safest and fastest way to delete all users 
    // and everything that depends on users (mentors, sessions, payments, etc.)
    // It will NOT affect tables like platform_config or coupons which don't have user foreign keys.
    await pool.query('TRUNCATE TABLE "users" CASCADE;');
    
    console.log("Successfully wiped all user data. The database is ready for fresh tests.");
  } catch (error) {
    console.error("Error wiping data:", error);
  } finally {
    await pool.end();
  }
}

main();
