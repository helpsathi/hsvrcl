import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie, signToken } from "@/lib/auth";
import { authRateLimiter } from "@/lib/rateLimit";

export async function GET() {
  const config = await prisma.platformConfig.findUnique({
    where: { key: "TEST_LOGIN_ENABLED" }
  });
  return NextResponse.json({ enabled: config?.value === "true" });
}

export async function POST(req: Request) {
  try {
    const clientIp = req.headers.get("x-forwarded-for") || "client_ip";
    const limitStatus = authRateLimiter.check(`auth_test_${clientIp}`);
    if (!limitStatus.success) {
      return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });
    }

    // 1. Verify that Test Login is ENABLED in config
    const config = await prisma.platformConfig.findUnique({
      where: { key: "TEST_LOGIN_ENABLED" }
    });
    if (!config || config.value !== "true") {
      return NextResponse.json({ error: "Test login is currently disabled by the administrator." }, { status: 403 });
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
    }

    // 2. Strictly check against the hardcoded test credentials
    if (email !== "test@helpsathi.com" || password !== "test@123") {
      return NextResponse.json({ error: "Invalid test credentials" }, { status: 401 });
    }

    // 3. Find or Create the test user
    let user = await prisma.user.findUnique({
      where: { email: "test@helpsathi.com" },
    });

    if (user && user.deletedAt !== null) {
      return NextResponse.json({ error: "Your account has been deleted or deactivated." }, { status: 403 });
    }
    if (user && user.isBanned) {
      return NextResponse.json({ error: "Your account has been permanently banned due to policy violations." }, { status: 403 });
    }
    if (user && user.isSuspended) {
      return NextResponse.json({ error: "Your account is temporarily suspended. Please contact support." }, { status: 403 });
    }

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "test@helpsathi.com",
          name: "Razorpay Test User",
          role: "STUDENT",
        },
      });
    }

    // Create session token
    const token = await signToken({ userId: user.id, role: user.role, adminSubRole: user.adminSubRole });
    await setSessionCookie(token);

    const userWithMentor = await prisma.user.findUnique({
      where: { id: user.id },
      include: { mentorProfile: { select: { status: true } } }
    });

    return NextResponse.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        role: user.role, 
        avatar: user.avatar,
        phone: user.phone,
        profileComplete: user.profileComplete,
        mentorStatus: userWithMentor?.mentorProfile?.status ?? null
      } 
    });
  } catch (error: any) {
    console.error("Test Auth Error:", error);
    return NextResponse.json({ error: `Authentication failed: ${error.message}` }, { status: 500 });
  }
}
