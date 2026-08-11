import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/rbac";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const authCheck = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "SUPPORT"] });
    if (!authCheck.authorized) {
      return authCheck.response!;
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "25")));
    const status = searchParams.get("status") || "ALL";
    const purpose = searchParams.get("purpose") || "ALL";
    const search = searchParams.get("search") || "";

    const where: any = {};

    if (purpose === "WALLET_RECHARGE") {
      where.type = "CREDIT";
    } else if (purpose === "SUBSCRIPTION" || purpose === "DIRECT_CALL") {
      where.type = "DEBIT";
    }

    if (search) {
      where.OR = [
        { referenceId: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { wallet: { user: { name: { contains: search, mode: "insensitive" } } } },
        { wallet: { user: { email: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const [total, transactions, creditAgg, totalCredits, totalDebits] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        include: {
          wallet: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.aggregate({
        where: { type: "CREDIT" },
        _sum: { amount: true },
      }),
      prisma.transaction.count({ where: { type: "CREDIT" } }),
      prisma.transaction.count({ where: { type: "DEBIT" } }),
    ]);

    const formattedPayments = transactions.map((t) => ({
      id: t.id,
      amount: t.amount,
      currency: "INR",
      gateway: t.referenceId?.startsWith("pay_") ? "Razorpay" : "Wallet Ledger",
      orderId: t.referenceId || `TXN-${t.id.slice(0, 8).toUpperCase()}`,
      paymentId: t.referenceId || undefined,
      status: "SUCCESS" as const,
      purpose: t.type === "CREDIT" ? "WALLET_RECHARGE" : "MENTORSHIP_PAYMENT",
      targetId: t.walletId,
      createdAt: t.createdAt.toISOString(),
      user: t.wallet.user,
    }));

    return NextResponse.json({
      success: true,
      payments: formattedPayments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        successVolume: creditAgg._sum.amount || 0,
        successCount: totalCredits,
        failedCount: 0,
        pendingCount: 0,
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/payments error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}
