import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const targetUserId = url.searchParams.get("userId") || session.userId;
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    // Only admins can inspect financial history of other users
    if (targetUserId !== session.userId && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { wallet: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch generous pool of records to pseudo-paginate in memory
    const [payments, transactions, subscriptions] = await Promise.all([
      (prisma as any).payment.findMany({
        where: { userId: targetUserId },
        orderBy: { createdAt: "desc" },
        take: 1000,
      }),
      user.wallet
        ? prisma.transaction.findMany({
            where: { walletId: user.wallet.id },
            orderBy: { createdAt: "desc" },
            take: 1000,
          })
        : Promise.resolve([]),
      prisma.subscription.findMany({
        where: { studentId: targetUserId },
        include: { mentor: { include: { user: { select: { name: true, email: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 1000,
      }),
    ]);

    // Normalize into a clean, unified feed sorted by timestamp
    const unifiedFeed = [
      ...payments.map((p: any) => ({
        id: p.id,
        type: "PAYMENT_GATEWAY",
        purpose: p.purpose,
        amount: p.amount,
        currency: p.currency,
        status: p.status,
        date: p.createdAt,
        reference: p.orderId || p.paymentId || p.id,
      })),
      ...transactions.map((t: any) => ({
        id: t.id,
        type: "WALLET_LEDGER",
        purpose: t.type, // CREDIT or DEBIT
        amount: t.amount,
        currency: "INR",
        status: "SUCCESS",
        date: t.createdAt,
        description: t.description,
        reference: t.referenceId,
      })),
      ...subscriptions.map((s: any) => ({
        id: s.id,
        type: "SUBSCRIPTION_CHARGE",
        purpose: `Subscription with Mentor ${s.mentor.user.name}`,
        amount: s.price,
        currency: "INR",
        status: s.isActive ? "ACTIVE" : "EXPIRED",
        date: s.startDate,
        reference: s.id,
      })),
    ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalRecords = unifiedFeed.length;
    const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
    const paginatedFeed = unifiedFeed.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      success: true,
      userId: targetUserId,
      walletBalance: user.wallet?.balance ?? 0,
      history: paginatedFeed,
      pagination: {
        page,
        limit,
        total: totalRecords,
        totalPages,
      }
    });
  } catch (error: any) {
    console.error("GET /api/payments/history error:", error);
    return NextResponse.json({ error: "Failed to load payment history" }, { status: 500 });
  }
}
