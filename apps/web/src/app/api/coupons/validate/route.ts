import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, amount, mentorId, category } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: String(code).trim().toUpperCase() },
      include: { usages: { where: { userId: session.userId } } },
    });

    if (!coupon || !coupon.isActive) {
      return NextResponse.json({ error: "Invalid or inactive coupon code" }, { status: 404 });
    }

    // Check expiry
    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      return NextResponse.json({ error: "Coupon code has expired" }, { status: 400 });
    }

    // Check minimum purchase amount
    const purchaseAmount = parseFloat(amount || 0);
    if (purchaseAmount < coupon.minPurchaseAmount) {
      return NextResponse.json(
        { error: `Minimum order amount of ₹${coupon.minPurchaseAmount} required for this coupon` },
        { status: 400 }
      );
    }

    // Check total limit
    if (coupon.totalLimit && coupon.usedCount >= coupon.totalLimit) {
      return NextResponse.json({ error: "Coupon limit reached" }, { status: 400 });
    }

    // Check per-user usage limit
    if (coupon.usages.length >= coupon.perUserLimit) {
      return NextResponse.json({ error: "You have reached the maximum uses for this coupon" }, { status: 400 });
    }

    // Check first-time-only constraint (Issue 1 fix)
    if (coupon.firstTimeOnly) {
      const totalUsagesByUser = await prisma.couponUsage.count({ where: { userId: session.userId } });
      if (totalUsagesByUser > 0) {
        return NextResponse.json({ error: "This coupon is valid for first-time users only" }, { status: 400 });
      }
    }

    // Check applicable mentors constraint (I7 & L2)
    if (mentorId && (coupon as any).applicableMentors?.length > 0) {
      if (!(coupon as any).applicableMentors.includes(mentorId)) {
        return NextResponse.json(
          { error: "This coupon code is not applicable for the selected mentor" },
          { status: 400 }
        );
      }
    }

    // Check applicable categories constraint
    if (category && coupon.applicableCategories?.length > 0) {
      if (!coupon.applicableCategories.includes(category)) {
        return NextResponse.json(
          { error: "This coupon is not applicable for this mentor category" },
          { status: 400 }
        );
      }
    }

    // Calculate discount amount
    let discount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discount = (purchaseAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = coupon.discountValue;
    }

    discount = Math.min(discount, purchaseAmount);

    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discount * 100) / 100,
        finalAmount: Math.max(0, Math.round((purchaseAmount - discount) * 100) / 100),
      },
    });
  } catch (error: any) {
    console.error("Coupon Validate Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
