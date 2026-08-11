import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const skip = (Math.max(page, 1) - 1) * limit;

    let wallet = await prisma.wallet.findUnique({
      where: { userId: session.userId },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        },
      },
    });

    // If wallet doesn't exist, create it (lazy initialization)
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: session.userId, balance: 0 },
        include: { transactions: true },
      });
    }

    const totalTransactions = await prisma.transaction.count({ where: { walletId: wallet.id } });

    let packs = [
      { amount: 100, label: "₹100", bonus: null, extra: null },
      { amount: 200, label: "₹200", bonus: null, extra: null },
      { amount: 500, label: "₹500", bonus: null, extra: "Popular" },
      { amount: 1000, label: "₹1000", bonus: null, extra: "Best Value" },
    ];
    
    try {
      const config = await prisma.platformConfig.findUnique({
        where: { key: "WALLET_PACKS" }
      });
      if (config && config.value) {
        packs = JSON.parse(config.value);
      }
    } catch (e) {
      console.warn("Failed to parse WALLET_PACKS config", e);
    }

    return NextResponse.json({ 
      success: true, 
      wallet,
      packs,
      pagination: {
        page,
        limit,
        total: totalTransactions,
        totalPages: Math.ceil(totalTransactions / limit)
      }
    });
  } catch (error: any) {
    console.error("Wallet Fetch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
