-- HelpSathi Baseline Database Schema Migration
-- Initializes ENUMs and core relational schemas for production sync

CREATE TYPE "Role" AS ENUM ('STUDENT', 'MENTOR', 'ADMIN');
CREATE TYPE "AdminSubRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'SUPPORT', 'MODERATOR');
CREATE TYPE "MentorStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'HIDDEN');
CREATE TYPE "CouponDiscountType" AS ENUM ('PERCENTAGE', 'FLAT');

CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "adminSubRole" "AdminSubRole",
    "googleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "phone" TEXT,
    "profileComplete" BOOLEAN NOT NULL DEFAULT false,
    "freeTrialChatsUsed" INTEGER NOT NULL DEFAULT 0,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "isSuspended" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "users_googleId_key" ON "users"("googleId");

CREATE TABLE IF NOT EXISTS "mentor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT,
    "status" "MentorStatus" NOT NULL DEFAULT 'PENDING',
    "bio" TEXT,
    "linkedinUrl" TEXT,
    "categories" TEXT[],
    "skills" TEXT[],
    "languages" TEXT[],
    "experience" INTEGER NOT NULL DEFAULT 0,
    "monthlyPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "perMinutePrice" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "commissionRate" DOUBLE PRECISION,
    "availability" JSONB,
    "freeTrial" BOOLEAN NOT NULL DEFAULT false,
    "bankDetails" JSONB,
    "upiId" TEXT,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "resumeUrl" TEXT,
    "subscribedBookingFree" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mentor_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "mentor_profiles_userId_key" ON "mentor_profiles"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "mentor_profiles_username_key" ON "mentor_profiles"("username");
ALTER TABLE "mentor_profiles" ADD CONSTRAINT "mentor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migration baseline complete
