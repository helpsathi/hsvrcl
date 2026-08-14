"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  CalendarBlank, 
  Clock, 
  CurrencyInr, 
  CheckCircle, 
  WarningCircle, 
  Spinner,
  Sparkle,
  Wallet,
  Star
} from "@phosphor-icons/react";

import { useAuth } from "@/components/providers/AuthProvider";

interface MentorInfo {
  id: string;
  userId: string;
  name: string;
  avatar: string | null;
  perMinutePrice: number;
  callPricePerMinute?: number;
  isOnline: boolean;
  categories: string[];
  subscribedBookingFree?: boolean;
  isSubscribed?: boolean;
  bookingNoticeHours?: number;
}

interface AvailabilitySlot {
  dayOfWeek: number;
  startHour: number;
  startMin: number;
  endHour: number;
  endMin: number;
}

const DURATION_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hour", value: 60 },
];

function getNextDays(n: number) {
  const days = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function getTimeSlots() {
  const slots = [];
  for (let h = 0; h <= 23; h++) {
    slots.push(`${h.toString().padStart(2, "0")}:00`);
    slots.push(`${h.toString().padStart(2, "0")}:30`);
  }
  return slots;
}

function formatTimeSlot12H(slot: string) {
  if (!slot) return "";
  const [hStr, mStr] = slot.split(":");
  let h = parseInt(hStr, 10);
  const period = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mStr} ${period}`;
}

export default function BookCallPage() {
  const params = useParams<{ mentorId: string }>();
  const mentorId = params?.mentorId as string;
  const router = useRouter();
  const { user } = useAuth();

  const [mentor, setMentor] = useState<MentorInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [subscribedBookingFree, setSubscribedBookingFree] = useState(true);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [notes, setNotes] = useState("");

  const days = getNextDays(14);
  const timeSlots = getTimeSlots();

  // Compute free booking eligibility
  const isFreeBooking = isSubscribed && subscribedBookingFree;
  const estimatedCost = isFreeBooking ? 0 : (mentor ? selectedDuration * (mentor.callPricePerMinute ?? mentor.perMinutePrice ?? 15) : 0);

  // Determine if a given time slot is available (checking mentor hours & same-day 60-minute notice threshold)
  const isSlotAvailable = (slot: string): boolean => {
    if (!selectedDate) return false;
    const [hStr, mStr] = slot.split(":");
    const slotH = parseInt(hStr, 10);
    const slotM = parseInt(mStr, 10);
    const slotEndTotalMins = slotH * 60 + slotM + selectedDuration;

    // Enforce dynamic advance booking notice for same-day requests
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    if (isToday) {
      const currentTotalMins = now.getHours() * 60 + now.getMinutes();
      const slotTotalMins = slotH * 60 + slotM;
      const noticeMinutes = (mentor?.bookingNoticeHours ?? 2) * 60;
      if (slotTotalMins < currentTotalMins + noticeMinutes) {
        return false;
      }
    }

    if (availabilitySlots.length === 0) return true; // No daily schedule restrictions if no availability set

    const dayOfWeek = selectedDate.getDay();
    return availabilitySlots.some((avail) => {
      if (avail.dayOfWeek !== dayOfWeek) return false;
      const slotTotal = slotH * 60 + slotM;
      const startTotal = avail.startHour * 60 + avail.startMin;
      const endTotal = avail.endHour * 60 + avail.endMin;
      return slotTotal >= startTotal && slotEndTotalMins <= endTotal;
    });
  };

  const availableSlotsForDay = selectedDate ? timeSlots.filter(isSlotAvailable) : timeSlots;

  useEffect(() => {
    const fetchMentor = async () => {
      try {
        const res = await fetch(`/api/mentors/${mentorId}`);
        const data = await res.json();
        if (res.ok) {
          setMentor(data.mentor);
          setIsSubscribed(data.mentor.isSubscribed ?? false);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchAvailability = async () => {
      try {
        const res = await fetch(`/api/mentors/${mentorId}/availability`);
        const data = await res.json();
        if (res.ok) {
          setAvailabilitySlots(data.slots || []);
          setSubscribedBookingFree(data.subscribedBookingFree ?? true);
        }
      } catch (err) {
        console.error(err);
      }
    };

    const fetchWallet = async () => {
      try {
        const res = await fetch("/api/wallet");
        const data = await res.json();
        if (res.ok) setWalletBalance(data.wallet?.balance ?? 0);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMentor();
    fetchAvailability();
    fetchWallet();
  }, [mentorId]);

  const handleBook = async () => {
    if (!selectedDate || !selectedTime || !mentor) return;
    if (user?.id === mentor.userId || user?.id === mentor.id) {
      setError("You cannot book a call with your own mentor account.");
      return;
    }
    setBooking(true);
    setError("");

    try {
      const [h, m] = selectedTime.split(":").map(Number);
      
      // Enforce IST Timezone (+05:30)
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const hourStr = String(h).padStart(2, "0");
      const minStr = String(m).padStart(2, "0");
      
      const scheduledAt = new Date(`${year}-${month}-${day}T${hourStr}:${minStr}:00+05:30`);

      const res = await fetch("/api/scheduled-calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentorProfileId: mentor.id,
          scheduledAt: scheduledAt.toISOString(),
          durationMinutes: selectedDuration,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.requireRecharge) {
          throw new Error(data.error + " Please recharge your wallet.");
        }
        throw new Error(data.error || "Booking failed");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    const { BookCallSkeleton } = require("@/components/ui/Skeleton");
    return <BookCallSkeleton />;
  }

  if (!mentor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 p-8 text-center">
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl p-8 rounded-3xl border border-white/50 dark:border-slate-800 shadow-2xl max-w-sm w-full space-y-4">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Mentor Not Found</h2>
          <Link href="/dashboard" className="w-full inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const isSelf = user ? (user.id === mentor.userId || user.id === mentor.id) : false;

  if (isSelf) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full space-y-5">
          <div className="w-16 h-16 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center mx-auto text-3xl">
            <Sparkle weight="fill" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Your Mentor Profile</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              You cannot book a consultation call with your own mentor account. To manage your availability or scheduled sessions, visit your mentor panel.
            </p>
          </div>
          <Link
            href="/mentor-dashboard"
            className="w-full inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 dark:bg-brand-500 dark:hover:bg-brand-400 text-white dark:text-slate-950 px-6 py-3.5 rounded-2xl font-bold text-sm shadow-md transition-colors"
          >
            Manage Mentor Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/50 dark:bg-slate-950/50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-purple-100/40 dark:from-blue-950/20 dark:to-purple-950/20 p-6 text-center">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl p-8 rounded-[32px] border border-white/60 dark:border-slate-800/60 shadow-2xl max-w-md w-full space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-500/20 shadow-lg">
            <CheckCircle weight="fill" className="text-5xl" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Call Booked!</h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm font-medium">
              Your consultation request with <strong className="text-blue-600 dark:text-blue-400">{mentor.name}</strong> has been scheduled.
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-left space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <div className="flex justify-between"><span>Mentor:</span> <span className="font-bold text-slate-900 dark:text-white">{mentor.name}</span></div>
            <div className="flex justify-between"><span>Duration:</span> <span className="font-bold text-slate-900 dark:text-white">{selectedDuration} min</span></div>
            <div className="flex justify-between"><span>Scheduled Time (IST):</span> <span className="font-bold text-slate-900 dark:text-white">{selectedDate?.toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short" })} at {selectedTime ? formatTimeSlot12H(selectedTime) : ""}</span></div>
            <div className="flex justify-between"><span>Estimated Cost:</span> <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{estimatedCost}</span></div>
          </div>
          <p className="text-xs text-slate-500 font-medium text-left">A Google Meet link will be provided once the mentor accepts your request.</p>
          <button
            onClick={() => router.push("/scheduled-calls")}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-2xl font-bold hover:from-blue-500 hover:to-indigo-500 transition-transform active:scale-[0.98] shadow-xl shadow-blue-500/25"
          >
            View Scheduled Calls
          </button>
        </div>
      </div>
    );
  }

  const canBook = selectedDate && selectedTime && !booking;
  const insufficientBalance = walletBalance !== null && walletBalance < estimatedCost;

  return (
    <div className="w-full min-h-full bg-slate-50/50 dark:bg-slate-950/50 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-transparent to-purple-100/40 dark:from-blue-950/20 dark:to-purple-950/20 py-6 md:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto pb-28 lg:pb-12">
        
        {/* Glass Top Header Card */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl p-4 md:p-6 rounded-[28px] border border-white/60 dark:border-slate-800/60 shadow-xl shadow-blue-900/5 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/mentors/${mentorId}`} className="p-2.5 -ml-1 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <ArrowLeft className="text-xl" />
            </Link>
            <div className="flex items-center gap-3.5">
              {mentor.avatar ? (
                <img 
                  src={mentor.avatar} 
                  alt={mentor.name} 
                  referrerPolicy="no-referrer"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/mentor-placeholder.png"; }}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-md" 
                />
              ) : (
                <img src="/mentor-placeholder.png" alt={mentor.name} className="w-12 h-12 md:w-14 md:h-14 rounded-2xl object-cover border-2 border-white dark:border-slate-700 shadow-md" />
              )}
              <div>
                <h1 className="font-extrabold text-slate-900 dark:text-white text-lg md:text-xl leading-tight">{mentor.name}</h1>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5 mt-0.5">
                  {isFreeBooking ? (
                    <><Sparkle weight="fill" className="text-emerald-400" /> <span className="text-emerald-600 dark:text-emerald-400">FREE call (Subscriber benefit)</span></>
                  ) : (
                    <><Sparkle weight="fill" className="text-amber-400" /> ₹{mentor.callPricePerMinute ?? mentor.perMinutePrice}/min call rate</>
                  )}
                </p>
              </div>
            </div>
          </div>

          {walletBalance !== null && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 shadow-sm">
              <Wallet weight="bold" className="text-blue-500 text-base" />
              <span>Wallet: ₹{walletBalance}</span>
            </div>
          )}
        </div>

        {/* Responsive 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Selection Controls */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Section 1: Session Duration */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl p-6 rounded-[28px] border border-white/50 dark:border-slate-800/50 shadow-xl space-y-4">
              <h2 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Clock weight="fill" className="text-blue-600 dark:text-blue-400" />
                <span>Select Duration</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedDuration(opt.value)}
                    className={`py-3.5 px-4 rounded-2xl text-sm font-extrabold transition-all duration-200 ${
                      selectedDuration === opt.value
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-[1.02]"
                        : "bg-white/80 dark:bg-slate-800/80 border border-white/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: Date Picker Carousel */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl p-6 rounded-[28px] border border-white/50 dark:border-slate-800/50 shadow-xl space-y-4">
              <h2 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <CalendarBlank weight="fill" className="text-blue-600 dark:text-blue-400" />
                <span>Select Date</span>
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {days.map((day) => {
                  const isSelected = selectedDate?.toDateString() === day.toDateString();
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={`flex flex-col items-center min-w-[76px] py-4 rounded-2xl text-sm font-extrabold shrink-0 transition-all duration-200 ${
                        isSelected
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 scale-[1.05]"
                          : "bg-white/80 dark:bg-slate-800/80 border border-white/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className={`text-[10px] uppercase font-black ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                        {day.toLocaleDateString("en", { weekday: "short" })}
                      </span>
                      <span className="text-xl font-black my-0.5">{day.getDate()}</span>
                      <span className={`text-[10px] font-bold ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                        {day.toLocaleDateString("en", { month: "short" })}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: Time Slot Grid — hard-block unavailable slots */}
            {selectedDate && (
              <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl p-6 rounded-[28px] border border-white/50 dark:border-slate-800/50 shadow-xl space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <h2 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                    <Clock weight="fill" className="text-blue-600 dark:text-blue-400" />
                    <span>Select Time Slot (IST)</span>
                  </h2>
                  <div className="text-right">
                    {availabilitySlots.length > 0 && (
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider">Gray = unavailable</span>
                    )}
                    <span className="block text-[10px] font-bold text-blue-500/80 dark:text-blue-400/80 uppercase tracking-wider mt-0.5">
                      {mentor?.bookingNoticeHours === 0 ? "⚡ Instant Booking" : `⏱ Min ${mentor?.bookingNoticeHours ?? 2} hr notice`}
                    </span>
                  </div>
                </div>
                {availableSlotsForDay.length === 0 && availabilitySlots.length > 0 ? (
                  <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                    <WarningCircle weight="fill" className="text-3xl mx-auto mb-2 text-amber-400" />
                    <p className="text-sm font-semibold">Mentor has no availability on this day.</p>
                    <p className="text-xs mt-1">Please select a different date.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {timeSlots.map((slot) => {
                      const isAvailable = isSlotAvailable(slot);
                      const isSelected = selectedTime === slot;
                      const formatted12h = formatTimeSlot12H(slot);
                      return (
                        <button
                          key={slot}
                          onClick={() => isAvailable && setSelectedTime(slot)}
                          disabled={!isAvailable}
                          className={`py-3.5 px-2 rounded-xl text-xs font-extrabold transition-all duration-200 ${
                            !isAvailable
                              ? "bg-slate-100 dark:bg-slate-800/30 text-slate-400 dark:text-slate-600 border border-slate-200/50 dark:border-slate-800/40 cursor-not-allowed opacity-60"
                              : isSelected
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 scale-[1.02]"
                                : "bg-white/80 dark:bg-slate-800/80 border border-white/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          {formatted12h}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Discussion Notes & Sticky Summary Card */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
            
            {/* Notes / Topics */}
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl p-6 rounded-[28px] border border-white/50 dark:border-slate-800/50 shadow-xl space-y-3">
              <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Discussion Topics (Optional)</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Share specific questions or goals for this call..."
                rows={3}
                className="w-full border border-white/60 dark:border-slate-800/60 rounded-2xl p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white/80 dark:bg-slate-950/80 text-slate-900 dark:text-white resize-none"
              />
            </div>

            {/* Live Desktop Summary Card */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-3xl p-6 rounded-[28px] border border-white/70 dark:border-slate-800/70 shadow-2xl space-y-5">
              <h2 className="font-black text-slate-900 dark:text-white text-lg border-b border-slate-200/60 dark:border-slate-800 pb-3">
                Booking Summary
              </h2>

              {selectedDate && selectedTime ? (
                <div className="space-y-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between items-center">
                    <span>Mentor Rate:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {isFreeBooking ? <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Sparkle weight="fill" /> FREE (Subscriber)</span> : `₹${mentor.callPricePerMinute ?? mentor.perMinutePrice}/min`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Duration:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedDuration} mins</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Selected Date:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedDate.toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Time Slot:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {formatTimeSlot12H(selectedTime)}
                    </span>
                  </div>

                  <div className="h-px bg-slate-200 dark:bg-slate-800 my-2"></div>

                  <div className="flex justify-between items-center text-base">
                    <span className="font-extrabold text-slate-900 dark:text-white">Total Cost:</span>
                    <span className={`font-black text-xl ${insufficientBalance ? "text-rose-500" : "text-emerald-500"}`}>
                      ₹{estimatedCost}
                    </span>
                  </div>

                  {insufficientBalance && (
                    <p className="text-xs font-bold text-rose-500 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                      Insufficient wallet balance (₹{walletBalance}). <Link href="/wallet" className="underline font-black">Recharge Wallet →</Link>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 py-4 text-center">
                  Select a duration, date, and time slot to view your summary.
                </p>
              )}

              {/* Error Alert */}
              {error && (
                <div className="flex items-start gap-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-2xl p-4 text-xs font-bold shadow-lg">
                  <WarningCircle weight="fill" className="text-lg shrink-0 mt-0.5" />
                  <div>
                    {error}
                    {error.includes("recharge") && (
                      <Link href="/wallet" className="ml-1.5 underline font-black">Recharge Wallet →</Link>
                    )}
                  </div>
                </div>
              )}

              {/* Direct Action Button (Visible only on desktop) */}
              <button
                onClick={handleBook}
                disabled={!canBook || insufficientBalance}
                className="hidden lg:flex w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-2xl font-extrabold text-base shadow-xl shadow-blue-500/25 transition-all items-center justify-center gap-2 disabled:opacity-40 disabled:hover:scale-100"
              >
                {booking ? (
                  <><Spinner className="animate-spin text-xl" /> Scheduling Call...</>
                ) : (
                  <><CheckCircle weight="fill" className="text-xl" /> Confirm & Book Call</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Glass Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_24px_rgba(0,0,0,0.15)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.5)] z-[50]">
        {selectedDate && selectedTime && (
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="font-bold text-slate-900 dark:text-white">{selectedDuration} min</span> on{" "}
              <span className="font-bold text-slate-900 dark:text-white">
                {selectedDate.toLocaleDateString("en", { weekday: "short", day: "numeric", month: "short" })}
              </span>{" "}
              at <span className="font-bold text-blue-600 dark:text-blue-400">{formatTimeSlot12H(selectedTime)}</span>
            </div>
            <div className={`flex items-center gap-1 font-black text-base ${insufficientBalance ? "text-rose-500" : "text-emerald-500"}`}>
              <span>₹{estimatedCost}</span>
            </div>
          </div>
        )}

        <button
          onClick={handleBook}
          disabled={!canBook || insufficientBalance}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-2xl font-extrabold text-base shadow-xl shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:hover:scale-100"
        >
          {booking ? (
            <><Spinner className="animate-spin text-xl" /> Scheduling Call...</>
          ) : (
            <><CheckCircle weight="fill" className="text-xl" /> Confirm & Book Call</>
          )}
        </button>
      </div>
    </div>
  );
}
