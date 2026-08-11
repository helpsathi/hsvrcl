import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { setSessionCookie, signToken } from "@/lib/auth";
import { authRateLimiter } from "@/lib/rateLimit";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: Request) {
  try {
    const clientIp = req.headers.get("x-forwarded-for") || "client_ip";
    const limitStatus = authRateLimiter.check(`auth_${clientIp}`);
    if (!limitStatus.success) {
      return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 });
    }

    const { credential } = await req.json();

    if (!credential) {
      return NextResponse.json({ error: "Missing credential" }, { status: 400 });
    }

    let email, name, picture, googleId;

    // Check if it's an idToken or accessToken (access tokens are shorter and not JWTs usually, but let's just try idToken first)
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) throw new Error("Invalid idToken payload");
      
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
      googleId = payload.sub;
    } catch (e) {
      // Fallback: treat as access_token
      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${credential}` }
      });
      if (!res.ok) {
        return NextResponse.json({ error: "Invalid google token" }, { status: 400 });
      }
      const data = await res.json();
      email = data.email;
      name = data.name;
      picture = data.picture;
      googleId = data.sub;
    }

    if (!email) {
      return NextResponse.json({ error: "No email provided" }, { status: 400 });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email },
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
          email,
          name: name || "User",
          avatar: picture || null,
          googleId,
          role: "STUDENT", // default role
        },
      });
    } else {
      // Sync googleId and avatar if provided by Google
      const updateData: Record<string, any> = {};
      if (!user.googleId && googleId) {
        updateData.googleId = googleId;
      }
      if (picture && (!user.avatar || user.avatar.trim() === "" || user.avatar.includes("googleusercontent") || user.avatar.includes("ui-avatars"))) {
        updateData.avatar = picture;
      }
      if (Object.keys(updateData).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });
      }
    }

    // Check for Super Admin override and sync DB role
    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "").trim().toLowerCase();
    const isSuperAdmin = Boolean(superAdminEmail && email.toLowerCase() === superAdminEmail);
    const finalRole = isSuperAdmin ? "ADMIN" : user.role;
    let finalAdminSubRole = user.adminSubRole;
    if (isSuperAdmin && (user.role !== "ADMIN" || user.adminSubRole !== "SUPER_ADMIN")) {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN", adminSubRole: "SUPER_ADMIN" },
      });
      user.role = "ADMIN";
      finalAdminSubRole = "SUPER_ADMIN";
    }

    // Create session token
    const token = await signToken({ userId: user.id, role: finalRole, adminSubRole: finalAdminSubRole });
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
        role: finalRole, 
        avatar: user.avatar,
        phone: user.phone,
        profileComplete: user.profileComplete,
        mentorStatus: userWithMentor?.mentorProfile?.status ?? null
      } 
    });
  } catch (error: any) {
    console.error("Google Auth Error:", error);
    return NextResponse.json({ error: `Authentication failed: ${error.message}` }, { status: 500 });
  }
}
