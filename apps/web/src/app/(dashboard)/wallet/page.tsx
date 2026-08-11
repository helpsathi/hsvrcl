"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Wallet as WalletIcon, 
  ArrowRight, 
  ChatCircleDots, 
  Plus, 
  CheckCircle, 
  XCircle, 
  ShieldCheck,
  Tag,
  X,
  ArrowsClockwise,
  Receipt
} from "@phosphor-icons/react";
import { WalletSkeleton } from "@/components/ui/Skeleton";
import { WalletBalanceCard } from "@/components/wallet/WalletBalanceCard";

interface Transaction {
  id: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  description: string | null;
  createdAt: string;
}

interface WalletData {
  balance: number;
  transactions: Transaction[];
}

declare global {
  interface Window {
    Razorpay: any;
  }
}



export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [selectedPack, setSelectedPack] = useState(200);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [packs, setPacks] = useState<{ amount: number, label: string, bonus: string | null, extra: string | null }[]>([]);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    finalAmount: number;
    discountType: string;
  } | null>(null);
  const [couponError, setCouponError] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const limit = 6;

  const fetchWallet = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const res = await fetch(`/api/wallet?page=${pageNum}&limit=${limit}`);
      const data = await res.json();
      if (res.ok) {
        setWallet(prev => {
          if (append && prev) {
            return {
              ...data.wallet,
              transactions: [...prev.transactions, ...data.wallet.transactions]
            };
          }
          return data.wallet;
        });

        if (!append) {
          if (data.packs && data.packs.length > 0) {
            setPacks(data.packs);
          } else {
            setPacks([
              { amount: 100, label: "₹100", bonus: null, extra: null },
              { amount: 200, label: "₹200", bonus: null, extra: null },
              { amount: 500, label: "₹500", bonus: null, extra: "Popular" },
              { amount: 1000, label: "₹1000", bonus: null, extra: "Best Value" },
            ]);
          }
        }

        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.total);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchWallet(1, false);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const couponAbortControllerRef = useRef<AbortController | null>(null);

  // Recalculate coupon if selectedPack changes
  useEffect(() => {
    if (appliedCoupon) {
      validateCoupon(appliedCoupon.code, selectedPack);
    }
  }, [selectedPack]);

  const validateCoupon = async (codeToTest: string, amount: number) => {
    if (!codeToTest.trim()) return;

    if (couponAbortControllerRef.current) {
      couponAbortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    couponAbortControllerRef.current = abortController;

    setValidatingCoupon(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeToTest.trim(),
          amount: amount,
        }),
        signal: abortController.signal,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAppliedCoupon({
          code: data.coupon.code,
          discountAmount: data.coupon.discountAmount,
          finalAmount: data.coupon.finalAmount,
          discountType: data.coupon.discountType,
        });
        setCouponError("");
      } else {
        setAppliedCoupon(null);
        setCouponError(data.error || "Invalid coupon code");
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setCouponError("Failed to validate coupon");
        setAppliedCoupon(null);
      }
    } finally {
      if (couponAbortControllerRef.current === abortController) {
        setValidatingCoupon(false);
      }
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  const payableAmount = appliedCoupon ? appliedCoupon.finalAmount : selectedPack;
  const discountApplied = appliedCoupon ? appliedCoupon.discountAmount : 0;

  const handleRecharge = async () => {
    setPaying(true);
    setError("");
    setSuccessMsg("");

    try {
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          amount: payableAmount, 
          type: "WALLET_RECHARGE" 
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || "Failed to create order");

      const { orderId, amount, currency, keyId } = orderData;

      await new Promise<void>((resolve, reject) => {
        const options = {
          key: keyId,
          amount,
          currency,
          name: "HelpSathi",
          description: appliedCoupon 
            ? `Wallet Recharge (Coupon ${appliedCoupon.code} applied)` 
            : "Wallet Recharge",
          order_id: orderId,
          handler: async (response: any) => {
            try {
              const verifyRes = await fetch("/api/payments/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  amount,
                  couponCode: appliedCoupon?.code,
                  discountApplied: discountApplied,
                }),
              });
              const verifyData = await verifyRes.json();
              if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed");
              setSuccessMsg(`₹${selectedPack} added to your wallet successfully!`);
              removeCoupon();
              await fetchWallet();
              resolve();
            } catch (e: any) {
              reject(e);
            }
          },
          prefill: {
            name: "",
            email: "",
          },
          theme: {
            color: "#10b981",
          },
          modal: {
            ondismiss: () => {
              reject(new Error("Payment cancelled"));
            },
          },
        };

        if (!window.Razorpay) {
          reject(new Error("Razorpay SDK not loaded. Please refresh and try again."));
          return;
        }

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (response: any) => {
          reject(new Error(response.error?.description || "Payment failed"));
        });
        rzp.open();
      });
    } catch (err: any) {
      if (err.message !== "Payment cancelled") {
        setError(err.message);
      }
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return <WalletSkeleton />;
  }

  return (
    <div className="w-full min-h-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-28 lg:pb-12 animate-in fade-in transition-colors">

      {/* Balance Card */}
      <div className="mb-8">
        <WalletBalanceCard balance={wallet?.balance || 0} variant="full" />
      </div>

      {/* Recharge Section */}
      <div className="mb-10 space-y-6">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">Select Recharge Pack</h3>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-2xl text-sm font-extrabold flex items-center gap-2.5 shadow-sm">
            <XCircle weight="fill" className="text-xl shrink-0 text-red-500" />
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 p-4 rounded-2xl text-sm font-extrabold flex items-center gap-2.5 shadow-sm">
            <CheckCircle weight="fill" className="text-xl shrink-0 text-green-500" />
            {successMsg}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {packs.map((pack) => {
            const isSelected = selectedPack === pack.amount;
            return (
              <div
                key={pack.amount}
                onClick={() => setSelectedPack(pack.amount)}
                className={`rounded-3xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 relative ${
                  isSelected
                    ? "bg-brand-50 dark:bg-brand-500/20 border-2 border-brand-500 dark:border-brand-400 text-slate-900 dark:text-white scale-[1.03] shadow-lg shadow-brand-500/10"
                    : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-brand-400 dark:hover:border-brand-500/60 shadow-sm hover:shadow-md"
                }`}
              >
                {pack.extra && (
                  <span className="absolute -top-3 bg-brand-500 dark:bg-brand-400 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">
                    {pack.extra}
                  </span>
                )}
                <span className="text-2xl font-black">{pack.label}</span>
                {pack.bonus && <span className="text-xs text-brand-700 dark:text-brand-300 font-extrabold mt-1">{pack.bonus}</span>}
              </div>
            );
          })}
        </div>

        {/* Coupon Code Section */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Tag weight="fill" className="text-blue-600 dark:text-blue-400" /> Have a Promo / Coupon Code?
            </span>
          </div>

          {!appliedCoupon ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon code (e.g. SAVE20)"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs uppercase font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                disabled={validatingCoupon || !couponInput.trim()}
                onClick={() => validateCoupon(couponInput, selectedPack)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition flex items-center gap-1"
              >
                {validatingCoupon ? <ArrowsClockwise className="animate-spin" /> : "Apply"}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                <CheckCircle weight="fill" className="text-lg text-emerald-600" />
                <span>
                  Coupon <strong>{appliedCoupon.code}</strong> applied! You save <strong>₹{appliedCoupon.discountAmount}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={removeCoupon}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X weight="bold" />
              </button>
            </div>
          )}

          {couponError && (
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400">{couponError}</p>
          )}

          {/* Pricing Breakdown if Coupon Applied */}
          {appliedCoupon && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Selected Recharge Pack:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">₹{selectedPack}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                <span>Coupon Discount ({appliedCoupon.code}):</span>
                <span>- ₹{appliedCoupon.discountAmount}</span>
              </div>
              <div className="flex justify-between font-black text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Payable Amount:</span>
                <span>₹{payableAmount}</span>
              </div>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold pt-0.5">
                ✨ ₹{selectedPack} will be credited to your wallet balance!
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleRecharge}
          disabled={paying}
          className="w-full bg-gradient-to-r from-brand-500 to-amber-500 dark:from-brand-500 dark:to-emerald-500 text-slate-950 py-4 px-6 rounded-2xl font-black text-lg shadow-xl hover:opacity-95 transition-all flex justify-center items-center gap-3 disabled:opacity-70 active:scale-[0.99]"
        >
          {paying ? (
            <>
              <svg className="animate-spin w-6 h-6 text-slate-950" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Opening Secure Checkout...
            </>
          ) : (
            <>
              Proceed to Recharge ₹{payableAmount} {appliedCoupon && <span className="line-through text-sm opacity-70">₹{selectedPack}</span>}
              <ArrowRight weight="bold" className="text-xl" />
            </>
          )}
        </button>
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3 font-bold">
          🔒 Payments are 256-bit SSL encrypted and instantly processed via Razorpay
        </p>
      </div>

      {/* Transaction History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">Recent Transactions</h3>
          <Link
            href="/payment-history"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors shadow-sm"
          >
            <Receipt className="text-sm" />
            Full History & Invoices
          </Link>
        </div>

        <div className="space-y-3">
          {wallet?.transactions.length === 0 && (
            <div className="bg-white/80 dark:bg-slate-900/80 rounded-3xl p-8 text-center text-slate-500 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 font-bold text-sm shadow-sm">
              No transactions yet. Select a pack above to add balance and start consulting mentors!
            </div>
          )}

          {wallet?.transactions.slice(0, 6).map((tx) => (
            <div 
              key={tx.id} 
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                {tx.type === "CREDIT" ? (
                  <div className="w-11 h-11 rounded-2xl bg-success/15 dark:bg-success/20 text-success flex items-center justify-center shrink-0">
                    <Plus weight="bold" className="text-xl" />
                  </div>
                ) : (
                  <div className="w-11 h-11 rounded-2xl bg-danger/15 dark:bg-danger/20 text-danger flex items-center justify-center shrink-0">
                    <ChatCircleDots weight="bold" className="text-xl" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug wrap-break-word">
                    {tx.description || (tx.type === "CREDIT" ? "Wallet Recharge" : "Session Consultation Payment")}
                  </p>
                  <p className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 mt-0.5">
                    {new Date(tx.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
              </div>
              <span className={`font-black text-base shrink-0 self-end sm:self-auto ${tx.type === "CREDIT" ? "text-success" : "text-slate-900 dark:text-white"}`}>
                {tx.type === "CREDIT" ? "+" : "-"} ₹{tx.amount}
              </span>
            </div>
          ))}

          {wallet?.transactions && wallet.transactions.length > 0 && (
            <div className="flex justify-center mt-6">
              <Link 
                href="/payment-history"
                className="px-6 py-2.5 text-xs sm:text-sm font-extrabold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition shadow-sm inline-flex items-center gap-2"
              >
                <span>See More</span>
                <ArrowRight weight="bold" className="text-sm" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
