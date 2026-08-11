import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  throw new Error("CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not defined in production!");
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev_secret_only_for_local_testing_do_not_use_in_prod"
);

export interface TokenPayload {
  userId: string;
  role: string;
  adminSubRole?: string | null;
}

export async function signToken(payload: TokenPayload, expiresIn = "7d"): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set("session_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

async function fetchUserWithRetry(userId: string, retries = 2, delayMs = 600) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          email: true,
          role: true,
          isBanned: true,
          isSuspended: true,
          deletedAt: true,
          adminSubRole: true,
          profileComplete: true,
        },
      });
    } catch (err: any) {
      const isConnectionError =
        err?.message?.includes("Connection terminated") ||
        err?.message?.includes("timeout") ||
        err?.message?.includes("ECONNRESET") ||
        err?.code === "P1001" ||
        err?.code === "P1002";

      if (isConnectionError && attempt < retries) {
        console.warn(
          `[auth:getSession] Database connection retry (attempt ${attempt + 1}/${retries}). Retrying in ${delayMs}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      console.error("[auth:getSession] Error retrieving session user:", err?.message || err);
      return null;
    }
  }
  return null;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload?.userId) return null;

  const user = await fetchUserWithRetry(payload.userId);

  if (!user || user.isBanned || user.isSuspended || user.deletedAt !== null) return null;

  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || "").trim().toLowerCase();
  const isSuperAdminEmail = Boolean(superAdminEmail && user.email.toLowerCase() === superAdminEmail);
  const finalRole = isSuperAdminEmail || Boolean(user.adminSubRole) || user.role === "ADMIN" ? "ADMIN" : user.role;
  const finalSubRole = isSuperAdminEmail ? "SUPER_ADMIN" : (user.adminSubRole || (finalRole === "ADMIN" ? "ADMIN" : null));

  return {
    ...payload,
    name: user.name,
    email: user.email,
    role: finalRole,
    adminSubRole: finalSubRole,
    profileComplete: user.profileComplete,
  };
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session_token");
}
