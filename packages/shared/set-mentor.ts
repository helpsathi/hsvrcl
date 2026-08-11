import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import * as fs from "fs";
import * as path from "path";

// Load .env manually
const envPath = path.resolve(__dirname, "../../.env");
const envFile = fs.readFileSync(envPath, "utf8");
envFile.split("\n").forEach(line => {
  const match = line.match(/^([^#\s]+?)=(.*)$/);
  if (match) process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, "");
});

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "technokeshri@gmail.com";
  
  // Find or create the user
  let user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.log(`User with email ${email} not found. Creating...`);
    user = await prisma.user.create({
      data: {
        email,
        name: "Techno Keshri",
        role: "MENTOR"
      }
    });
  } else {
    // Update role to MENTOR
    await prisma.user.update({
      where: { id: user.id },
      data: { role: "MENTOR" }
    });
  }

  // Check if MentorProfile exists
  const mentorProfile = await prisma.mentorProfile.findUnique({
    where: { userId: user.id }
  });

  if (!mentorProfile) {
    // Create new approved mentor profile
    await prisma.mentorProfile.create({
      data: {
        userId: user.id,
        status: "APPROVED",
        bio: "Expert mentor ready to help you crush your exams.",
        categories: ["JEE", "NEET"],
        skills: ["Physics", "Mathematics"],
        languages: ["English", "Hindi"],
        experience: 5,
        monthlyPrice: 500,
        perMinutePrice: 15,
        isOnline: true
      }
    });
    console.log(`Created and approved MentorProfile for ${email}`);
  } else {
    // Approve existing profile
    await prisma.mentorProfile.update({
      where: { id: mentorProfile.id },
      data: { status: "APPROVED" }
    });
    console.log(`Approved existing MentorProfile for ${email}`);
  }

  console.log("Successfully set user as an APPROVED mentor.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
