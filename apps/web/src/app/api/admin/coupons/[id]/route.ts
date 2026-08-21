import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/rbac";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN"] });
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: {
        usages: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        _count: { select: { usages: true } },
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    console.error("GET /api/admin/coupons/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN"] });
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    const body = await req.json();

    if (body.toggleActive !== undefined) {
      const updated = await prisma.coupon.update({
        where: { id },
        data: { isActive: !existing.isActive },
      });
      return NextResponse.json({ success: true, coupon: updated, message: `Coupon is now ${updated.isActive ? "active" : "inactive"}.` });
    }

    const {
      code,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      totalLimit,
      perUserLimit,
      firstTimeOnly,
      applicableCategories,
      applicableMentors,
      applicableFor,
      expiresAt,
      showOnDashboard,
      isActive
    } = body;

    const data: any = {};
    if (code !== undefined) data.code = String(code).trim().toUpperCase();
    if (discountType !== undefined) data.discountType = discountType;
    if (discountValue !== undefined) data.discountValue = Number(discountValue);
    if (minPurchaseAmount !== undefined) data.minPurchaseAmount = Number(minPurchaseAmount);
    if (maxDiscountAmount !== undefined) data.maxDiscountAmount = maxDiscountAmount ? Number(maxDiscountAmount) : null;
    if (totalLimit !== undefined) data.totalLimit = Number(totalLimit);
    if (perUserLimit !== undefined) data.perUserLimit = Number(perUserLimit);
    if (firstTimeOnly !== undefined) data.firstTimeOnly = Boolean(firstTimeOnly);
    if (applicableCategories !== undefined) data.applicableCategories = Array.isArray(applicableCategories) ? applicableCategories : [];
    if (applicableMentors !== undefined) data.applicableMentors = Array.isArray(applicableMentors) ? applicableMentors : [];
    if (applicableFor !== undefined) data.applicableFor = Array.isArray(applicableFor) ? applicableFor : [];
    if (expiresAt !== undefined) data.expiresAt = new Date(expiresAt);
    if (showOnDashboard !== undefined) data.showOnDashboard = Boolean(showOnDashboard);
    if (isActive !== undefined) data.isActive = Boolean(isActive);

    const updated = await prisma.coupon.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, coupon: updated, message: "Coupon updated successfully." });
  } catch (error: any) {
    console.error("PATCH /api/admin/coupons/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN"] });
    if (!auth.authorized) return auth.response!;

    const { id } = await params;
    await prisma.coupon.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Coupon deleted successfully." });
  } catch (error: any) {
    console.error("DELETE /api/admin/coupons/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
