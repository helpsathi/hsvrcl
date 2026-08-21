import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/rbac";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN"] });
    if (!auth.authorized) return auth.response!;

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "15", 10), 100);
    const skip = (Math.max(page, 1) - 1) * limit;

    const [coupons, total, activeCount, totalUsagesCount, discountSum] = await Promise.all([
      prisma.coupon.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { usages: true } },
        },
        skip,
        take: limit,
      }),
      prisma.coupon.count(),
      prisma.coupon.count({ where: { isActive: true } }),
      prisma.couponUsage.count(),
      prisma.couponUsage.aggregate({
        _sum: { discountApplied: true },
      }),
    ]);

    return NextResponse.json({ 
      coupons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        totalCoupons: total,
        activeCoupons: activeCount,
        totalUsages: totalUsagesCount,
        totalDiscountGiven: discountSum._sum.discountApplied || 0,
      }
    });
  } catch (error: any) {
    console.error("GET /api/admin/coupons error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN"] });
    if (!auth.authorized) return auth.response!;

    const body = await req.json();
    const {
      code,
      discountType,
      discountValue,
      maxDiscountAmount,
      minPurchaseAmount,
      totalLimit,
      perUserLimit,
      firstTimeOnly,
      applicableCategories,
      applicableMentors,
      applicableFor,
      expiresAt,
      showOnDashboard,
    } = body;

    if (!code || discountValue === undefined) {
      return NextResponse.json({ error: "Code and discount value required" }, { status: 400 });
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        code: String(code).trim().toUpperCase(),
        discountType: discountType === "FLAT" ? "FLAT" : "PERCENTAGE",
        discountValue: parseFloat(discountValue),
        maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
        minPurchaseAmount: minPurchaseAmount ? parseFloat(minPurchaseAmount) : 0,
        totalLimit: totalLimit ? parseInt(totalLimit) : null,
        perUserLimit: perUserLimit ? parseInt(perUserLimit) : 1,
        firstTimeOnly: Boolean(firstTimeOnly),
        applicableCategories: Array.isArray(applicableCategories) ? applicableCategories : (applicableCategories ? String(applicableCategories).split(",").map(s => s.trim()).filter(Boolean) : []),
        applicableMentors: Array.isArray(applicableMentors) ? applicableMentors : (applicableMentors ? String(applicableMentors).split(",").map(s => s.trim()).filter(Boolean) : []),
        applicableFor: Array.isArray(applicableFor) ? applicableFor : [],
        showOnDashboard: Boolean(showOnDashboard),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: session!.userId,
          action: "CREATE_COUPON",
          targetId: newCoupon.id,
          details: `Created coupon code ${newCoupon.code} (${newCoupon.discountType} ${newCoupon.discountValue})`,
        },
      });
    } catch (e) {
      console.error("Audit log error:", e);
    }

    return NextResponse.json({ success: true, coupon: newCoupon });
  } catch (error: any) {
    console.error("POST /api/admin/coupons error:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
