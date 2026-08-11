import { NextResponse } from "next/server";
import { getSession, clearSession, signToken, setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validatePhoneNumber } from "@/lib/phoneValidation";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true, 
        avatar: true,
        phone: true,
        profileComplete: true,
        adminSubRole: true,
        freeTrialChatsUsed: true,
        mentorProfile: { select: { status: true } }
      },
    });

    if (!user) {
      await clearSession();
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const effectiveRole = user.adminSubRole ? "ADMIN" : user.role;
    if (session.role !== effectiveRole || session.adminSubRole !== user.adminSubRole) {
      const token = await signToken({ userId: user.id, role: effectiveRole, adminSubRole: user.adminSubRole });
      await setSessionCookie(token);
    }

    return NextResponse.json({ 
      user: {
        ...user,
        role: effectiveRole,
        mentorStatus: user.mentorProfile?.status ?? null
      } 
    });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, avatar } = body;

    const dataToUpdate: any = {};
    if (name !== undefined && typeof name === "string" && name.trim() !== "") {
      dataToUpdate.name = name.trim();
    }
    if (phone !== undefined && phone !== null && String(phone).trim() !== "") {
      const phoneValidation = validatePhoneNumber(String(phone));
      if (!phoneValidation.isValid) {
        return NextResponse.json({ error: phoneValidation.error || "Invalid mobile number" }, { status: 400 });
      }
      dataToUpdate.phone = phoneValidation.cleanPhone;
    } else if (phone === null || phone === "") {
      dataToUpdate.phone = null;
    }
    if (avatar !== undefined) {
      if (avatar !== "" && !String(avatar).startsWith("http") && !String(avatar).startsWith("/")) {
        return NextResponse.json({ error: "Invalid avatar image URL format." }, { status: 400 });
      }
      dataToUpdate.avatar = avatar;
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: dataToUpdate,
      select: { 
        id: true, 
        email: true, 
        name: true, 
        role: true, 
        avatar: true,
        phone: true,
        profileComplete: true,
        freeTrialChatsUsed: true,
        mentorProfile: { select: { status: true } }
      },
    });

    return NextResponse.json({ 
      success: true,
      user: {
        ...updatedUser,
        mentorStatus: updatedUser.mentorProfile?.status ?? null
      } 
    });
  } catch (error: any) {
    console.error("Profile Update PATCH Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  }
}

