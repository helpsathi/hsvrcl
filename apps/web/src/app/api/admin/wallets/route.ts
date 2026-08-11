import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, DEFAULT_TRANSACTION_OPTIONS } from "@/lib/prisma";
import { requireAdminPermission } from "@/lib/rbac";
import { formatDatabaseError } from "@/lib/errors";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "FINANCE"] });
    if (!auth.authorized) return auth.response!;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "25")));
    const role = searchParams.get("role") || "ALL";
    const search = searchParams.get("search") || "";

    const where: any = {};

    if (role !== "ALL") {
      where.user = { role };
    }

    if (search) {
      where.user = {
        ...(where.user || {}),
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const [total, wallets, totalSystemBalanceAgg, totalWalletsCount] = await Promise.all([
      prisma.wallet.count({ where }),
      prisma.wallet.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true, avatar: true },
          },
          transactions: {
            orderBy: { createdAt: "desc" },
            take: 3,
          },
        },
        orderBy: { balance: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.wallet.aggregate({
        _sum: { balance: true, lockedBalance: true },
      }),
      prisma.wallet.count(),
    ]);

    return NextResponse.json({
      success: true,
      wallets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalSystemBalance: totalSystemBalanceAgg._sum.balance || 0,
        totalLockedBalance: totalSystemBalanceAgg._sum.lockedBalance || 0,
        totalWalletsCount,
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/wallets error:", error);
    return NextResponse.json({ error: "Failed to fetch wallets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    const auth = requireAdminPermission(session, { requiredSubRoles: ["SUPER_ADMIN", "ADMIN", "FINANCE"] });
    if (!auth.authorized) return auth.response!;

    const { userId, amount, type, reason } = await req.json();

    const adjustAmount = parseFloat(amount);
    if (!userId || isNaN(adjustAmount) || adjustAmount <= 0) {
      return NextResponse.json({ error: "Valid userId and positive amount are required" }, { status: 400 });
    }

    if (type !== "CREDIT" && type !== "DEBIT") {
      return NextResponse.json({ error: "Type must be CREDIT or DEBIT" }, { status: 400 });
    }

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json({ error: "Detailed reason is required (min 5 characters)" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallet: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure wallet exists
    let wallet = user.wallet;
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: user.id, balance: 0 },
      });
    }

    if (type === "DEBIT" && wallet.balance < adjustAmount) {
      return NextResponse.json({
        error: `Insufficient balance (current: ₹${wallet.balance}) to debit ₹${adjustAmount}`,
      }, { status: 400 });
    }

    const balanceDelta = type === "CREDIT" ? adjustAmount : -adjustAmount;

    const result = await prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: balanceDelta },
        },
      });

      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: type === "CREDIT" ? "ADMIN_CREDIT" : "ADMIN_DEBIT",
          amount: adjustAmount,
          description: `Admin manual adjustment: ${reason}`,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session!.userId,
          action: type === "CREDIT" ? "WALLET_MANUAL_CREDIT" : "WALLET_MANUAL_DEBIT",
          targetId: user.id,
          details: `Manual ${type} of ₹${adjustAmount} to ${user.name} (${user.email}). Reason: ${reason}. New balance: ₹${updatedWallet.balance}`,
        },
      });

      return updatedWallet;
    }, DEFAULT_TRANSACTION_OPTIONS);

    return NextResponse.json({
      success: true,
      message: `Successfully ${type.toLowerCase()}ed ₹${adjustAmount} to user wallet`,
      wallet: result,
    });
  } catch (error: any) {
    console.error("POST /api/admin/wallets error:", error);
    const friendlyMsg = formatDatabaseError(error, "Failed to adjust wallet balance. Please try again.");
    return NextResponse.json({ error: friendlyMsg }, { status: 500 });
  }
}
