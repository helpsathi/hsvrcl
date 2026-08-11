import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "MENTOR" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const mentor = await prisma.mentorProfile.findUnique({
      where: { userId: session.userId },
      select: { bankDetails: true, upiId: true },
    });

    if (!mentor) {
      return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      bankDetails: mentor.bankDetails || null,
      upiId: mentor.upiId || null,
    });
  } catch (error: any) {
    console.error("Fetch Bank Details Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "MENTOR" && session.role !== "ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bankDetails, upiId } = await req.json();

    if (!bankDetails && !upiId) {
      return NextResponse.json({ error: "Provide either Bank Details or UPI ID" }, { status: 400 });
    }

    const updated = await prisma.mentorProfile.update({
      where: { userId: session.userId },
      data: {
        ...(bankDetails !== undefined ? { bankDetails } : {}),
        ...(upiId !== undefined ? { upiId: String(upiId).trim() } : {}),
      },
      select: { bankDetails: true, upiId: true },
    });

    return NextResponse.json({ success: true, message: "Payout details updated successfully", details: updated });
  } catch (error: any) {
    console.error("Update Bank Details Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export const PUT = POST;
