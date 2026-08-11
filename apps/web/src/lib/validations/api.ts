import { z } from "zod";

export const ChatInitiateSchema = z.object({
  mentorId: z.string().min(1, "mentorId is required"),
});

export const SubscriptionCreateSchema = z.object({
  mentorId: z.string().min(1, "mentorId is required"),
  paymentMethod: z.enum(["WALLET", "RAZORPAY", "GATEWAY"]).default("WALLET"),
  couponCode: z.string().optional(),
  discountApplied: z.number().optional(),
});

export const AdminUserUpdateSchema = z.object({
  action: z.enum(["BAN", "UNBAN", "SUSPEND", "UNSUSPEND", "EDIT"]).optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(["STUDENT", "MENTOR", "ADMIN"]).optional(),
  adminSubRole: z.enum(["SUPER_ADMIN", "ADMIN", "SUPPORT", "MODERATOR"]).nullable().optional(),
  isBanned: z.boolean().optional(),
  isSuspended: z.boolean().optional(),
});

export const AdminMentorCreateSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  bio: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  categories: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  experience: z.number().nonnegative().default(0),
  monthlyPrice: z.number().nonnegative().default(0),
  perMinutePrice: z.number().nonnegative().default(15),
  callPricePerMinute: z.number().nonnegative().optional().default(15),
  commissionRate: z.number().min(10).max(80).optional(),
  freeTrial: z.boolean().default(true),
  subscribedBookingFree: z.boolean().default(true),
});

export const WebPushSubscribeSchema = z.object({
  endpoint: z.string().url("Invalid push endpoint URL"),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});
