import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validatePhoneNumber } from "@/lib/phoneValidation";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, phone, avatar } = await req.json();

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    }

    // Strict Phone validation
    const phoneValidation = validatePhoneNumber(phone);
    if (!phoneValidation.isValid) {
      return NextResponse.json({ error: phoneValidation.error || "Invalid mobile number" }, { status: 400 });
    }

    // Avatar validation to prevent massive base64 storage
    if (avatar && !avatar.startsWith("http")) {
      return NextResponse.json({ error: "Invalid avatar format. Base64 is not allowed." }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        name: name.trim(),
        phone: phoneValidation.cleanPhone,
        avatar,
        profileComplete: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Profile Complete Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
