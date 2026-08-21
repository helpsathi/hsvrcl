"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import { 
  X, 
  Sparkle, 
  CheckCircle, 
  ShieldCheck, 
  Tag, 
  ArrowsClockwise, 
  Crown,
  CreditCard,
  Wallet
} from "@phosphor-icons/react";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentor: {
    id: string;
    name: string;
    avatar: string | null;
    monthlyPrice: number;
    categories: string[];
  };
  user: {
    name?: string | null;
    email?: string | null;
  } | null;
  onSubscriptionSuccess: () => void;
  defaultPaymentMethod?: "WALLET" | "RAZORPAY";
}

export default function SubscriptionCheckoutModal({
  isOpen,
  onClose,
  mentor,
  user,
  onSubscriptionSuccess,
  defaultPaymentMethod,
}: SubscriptionModalProps) {
  const [couponCode, setCouponCode] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
    finalAmount: number;
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"WALLET" | "RAZORPAY">(defaultPaymentMethod || "RAZORPAY");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(false);

  const basePrice = mentor.monthlyPrice || 999;
  const payablePrice = appliedCoupon ? appliedCoupon.finalAmount : basePrice;
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;

  useEffect(() => {
    if (isOpen) {
      setPaymentMethod(defaultPaymentMethod || "RAZORPAY");
    }
    if (isOpen && user) {
      setLoadingWallet(true);
      fetch("/api/wallet")
        .then((res) => res.json())
        .then((data) => {
          if (data.wallet) {
            setWalletBalance(data.wallet.balance ?? 0);
          }
        })
        .catch((e) => console.error("Error fetching wallet:", e))
        .finally(() => setLoadingWallet(false));
    }
  }, [isOpen, user]);

  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  if (!isOpen) return null;

  const insufficientWallet = paymentMethod === "WALLET" && walletBalance !== null && walletBalance < payablePrice;

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setValidatingCoupon(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          amount: basePrice,
          mentorId: mentor.id,
          category: mentor.categories?.[0],
          context: "SUBSCRIPTION",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAppliedCoupon({
          code: data.coupon.code,
          discountAmount: data.coupon.discountAmount,
          finalAmount: data.coupon.finalAmount,
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
      if (abortControllerRef.current === controller) {
        setValidatingCoupon(false);
      }
    }
  };

  const handleSubscribe = async () => {
    if (!user) return;
    setSubscribing(true);
    setError("");

    try {
      const subInitRes = await fetch("/api/payments/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: payablePrice,
          mentorId: mentor.id,
          couponCode: appliedCoupon?.code,
          discountApplied: discountAmount,
          paymentMethod: paymentMethod,
        }),
      });
      const subInitData = await subInitRes.json();
      if (!subInitRes.ok) throw new Error(subInitData.error || "Failed to initialize subscription");

      if (subInitData.paymentMethod === "WALLET" || paymentMethod === "WALLET") {
        onSubscriptionSuccess();
        onClose();
        return;
      }

      const { subscriptionId, orderId, keyId } = subInitData;

      await new Promise<void>((resolve, reject) => {
        const options: any = {
          key: keyId,
          name: "HelpSathi",
          description: appliedCoupon
            ? `Monthly Subscription — ${mentor.name} (Coupon ${appliedCoupon.code})`
            : `Monthly Subscription — ${mentor.name}`,
          handler: async (response: any) => {
            try {
              const subRes = await fetch("/api/subscriptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  mentorId: mentor.id,
                  price: payablePrice,
                  subscriptionId: response.razorpay_subscription_id || subscriptionId || undefined,
                  orderId: response.razorpay_order_id || orderId || undefined,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                  couponCode: appliedCoupon?.code,
                  discountApplied: discountAmount,
                }),
              });
              const subData = await subRes.json();
              if (!subRes.ok) throw new Error(subData.error || "Subscription verification failed");

              onSubscriptionSuccess();
              onClose();
              resolve();
            } catch (e: any) {
              reject(e);
            }
          },
          prefill: {
            name: user.name || "",
            email: user.email || "",
          },
          theme: {
            color: "#4f46e5",
          },
          modal: {
            ondismiss: () => {
              reject(new Error("Payment cancelled"));
            },
          },
        };

        if (subscriptionId) {
          options.subscription_id = subscriptionId;
        } else if (orderId) {
          options.order_id = orderId;
        }

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
      setSubscribing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 animate-in zoom-in-95 duration-150 relative overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Decorative background glow */}
        <div className="absolute -right-16 -top-16 w-44 h-44 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl font-bold shadow-xs">
              <Crown weight="fill" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Monthly Mentorship Pass
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unlimited 1-on-1 chats & prioritized support
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
          >
            <X weight="bold" className="text-lg" />
          </button>
        </div>

        {/* Mentor summary banner */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-900 overflow-hidden font-bold flex items-center justify-center shrink-0">
            {mentor.avatar ? (
              <img 
                src={mentor.avatar} 
                alt="" 
                referrerPolicy="no-referrer" 
                onError={(e) => { (e.target as HTMLImageElement).src = "/mentor-placeholder.png"; }}
                className="w-full h-full object-cover" 
              />
            ) : (
              mentor.name.charAt(0)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
              {mentor.name}
            </h4>
            <p className="text-xs text-slate-500">
              {mentor.categories?.join(", ") || "Verified Mentor"}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs text-slate-400 block font-medium">Standard</span>
            <span className="text-sm font-black text-slate-900 dark:text-white">
              ₹{basePrice}/mo
            </span>
          </div>
        </div>

        {/* Plan Benefits */}
        <div className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle weight="fill" className="text-emerald-500 text-sm" />
            <span>Unlimited live 1-on-1 chat access</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle weight="fill" className="text-emerald-500 text-sm" />
            <span>Priority direct responses & guidance</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle weight="fill" className="text-emerald-500 text-sm" />
            <span>Cancel anytime directly from your dashboard</span>
          </div>
        </div>

        {/* Coupon Code Section */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Tag weight="fill" className="text-indigo-600 dark:text-indigo-400" /> Apply Coupon Code
          </label>

          {!appliedCoupon ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="PROMO CODE"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs uppercase font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                disabled={validatingCoupon || !couponCode.trim()}
                onClick={handleValidateCoupon}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-1"
              >
                {validatingCoupon ? <ArrowsClockwise className="animate-spin" /> : "Apply"}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 text-xs font-bold">
              <span>
                ✓ Coupon <strong>{appliedCoupon.code}</strong> applied (-₹{appliedCoupon.discountAmount})
              </span>
              <button
                type="button"
                onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X weight="bold" />
              </button>
            </div>
          )}

          {couponError && (
            <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400">{couponError}</p>
          )}

          {/* Pricing breakdown */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>Monthly Subscription:</span>
              <span>₹{basePrice}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                <span>Discount:</span>
                <span>- ₹{discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-900 dark:text-white font-black text-sm pt-1 border-t border-slate-200 dark:border-slate-800">
              <span>Total Payable:</span>
              <span>₹{payablePrice} / month</span>
            </div>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            Select Payment Method
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <div
              onClick={() => setPaymentMethod("WALLET")}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                paymentMethod === "WALLET"
                  ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wallet weight="fill" className="text-indigo-600 dark:text-indigo-400 text-base" />
                  HelpSathi Wallet
                </span>
                {paymentMethod === "WALLET" && <CheckCircle weight="fill" className="text-indigo-600 dark:text-indigo-400 text-base" />}
              </div>
              <div className="mt-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {loadingWallet ? "Checking balance..." : `Balance: ₹${walletBalance ?? 0}`}
              </div>
            </div>

            <div
              onClick={() => setPaymentMethod("RAZORPAY")}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                paymentMethod === "RAZORPAY"
                  ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard weight="fill" className="text-indigo-600 dark:text-indigo-400 text-base" />
                  Razorpay Gateway
                </span>
                {paymentMethod === "RAZORPAY" && <CheckCircle weight="fill" className="text-indigo-600 dark:text-indigo-400 text-base" />}
              </div>
              <div className="mt-2 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                Cards, UPI & NetBanking
              </div>
            </div>
          </div>

          {insufficientWallet && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 text-xs font-extrabold flex items-center justify-between">
              <span>Insufficient wallet balance (₹{walletBalance}).</span>
              <Link href="/wallet" onClick={onClose} className="underline font-black text-indigo-600 dark:text-indigo-400">
                Recharge Wallet →
              </Link>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold">
            {error}
          </div>
        )}

        {/* Subscribe Action */}
        <button
          onClick={handleSubscribe}
          disabled={subscribing || Boolean(insufficientWallet)}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3.5 px-6 rounded-2xl font-black text-sm shadow-xl hover:opacity-95 transition-all flex justify-center items-center gap-2 disabled:opacity-60"
        >
          {subscribing ? (
            <>
              <ArrowsClockwise className="animate-spin text-lg" />
              Processing Secure Checkout...
            </>
          ) : (
            <>
              {paymentMethod === "WALLET" ? <Wallet weight="bold" className="text-lg" /> : <CreditCard weight="bold" className="text-lg" />}
              {paymentMethod === "WALLET"
                ? `Pay ₹${payablePrice} from Wallet & Activate`
                : `Pay ₹${payablePrice}/month via Razorpay`}
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck weight="fill" className="text-emerald-500" /> 
          {paymentMethod === "WALLET" ? "Instant activation via HelpSathi Wallet • Cancel anytime" : "Powered by Razorpay • Cancel anytime"}
        </p>
      </div>
    </div>
  );
}
