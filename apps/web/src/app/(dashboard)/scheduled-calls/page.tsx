"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { VideoCamera, XCircle, CheckCircle, Clock, Spinner, Star, WarningCircle } from "@phosphor-icons/react";
import Link from "next/link";
import ReviewModal from "@/components/mentors/ReviewModal";

interface ScheduledCall {
  id: string;
  studentId: string;
  mentorId: string;
  student: { name: string; avatar: string | null };
  mentor: { name: string; avatar: string | null };
  scheduledAt: string;
  durationMinutes: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "RESCHEDULED" | "MISSED" | "ACCEPTED" | "REJECTED" | "DISPUTED";
  estimatedCost: number;
  meetLink: string | null;
}

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ hours: number, minutes: number, seconds: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference > 0) {
        return {
          hours: Math.floor((difference / (1000 * 60 * 60))),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return null;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return <span className="font-bold text-emerald-600">Starting Now!</span>;
  }

  return (
    <span className="font-mono font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
      {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
    </span>
  );
}

export default function ScheduledCallsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [calls, setCalls] = useState<ScheduledCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reviewingMentor, setReviewingMentor] = useState<{ id: string; name: string } | null>(null);

  const [activeTab, setActiveTab] = useState<"upcoming" | "past" | "all">("upcoming");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const fetchCalls = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/scheduled-calls?page=${page}&limit=${limit}&status=${activeTab}`);
      const data = await res.json();
      if (res.ok) {
        setCalls(data.calls || []);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
          setTotalItems(data.pagination.total);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, [activeTab, page]);

  const updateStatus = async (id: string, newStatus: string) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/scheduled-calls/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Call status updated to ${newStatus.toLowerCase()}`);
        await fetchCalls();
      } else {
        const error = await res.json();
        toast.error(error.error || "Action failed");
      }
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    const { ScheduledCallsSkeleton } = require("@/components/ui/Skeleton");
    return <ScheduledCallsSkeleton />;
  }

  return (
    <div className="w-full min-h-full bg-transparent py-6 px-4 sm:px-6 lg:px-8 pb-28 animate-in fade-in transition-colors">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Scheduled Consultations</h1>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">Manage and attend your upcoming 1-on-1 mentorship video meetings</p>
          </div>
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(["upcoming", "past", "all"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setPage(1); }}
                className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all capitalize ${activeTab === tab ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {calls.length === 0 && !loading ? (
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-12 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center shadow-xl transition-colors">
            <VideoCamera className="text-5xl text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-extrabold text-sm">No scheduled consultations found.</p>
            {user?.role === "STUDENT" && (
              <Link href="/mentors" className="inline-block mt-4 text-brand-600 dark:text-brand-400 font-black hover:underline text-sm">
                Browse Mentors Directory →
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {calls.map((call) => {
              const isMentor = user?.role === "MENTOR";
              const otherUser = isMentor ? call.student : call.mentor;
              const scheduledDate = new Date(call.scheduledAt);
              const now = new Date();
              const diffMs = scheduledDate.getTime() - now.getTime();
              const diffMinutes = diffMs / (1000 * 60);
              const canJoin = call.status === "CONFIRMED" && diffMinutes <= 5 && diffMinutes >= -call.durationMinutes;
              const isPastPending = call.status === "PENDING" && diffMs < 0;

              return (
                <div key={call.id} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl flex flex-col md:flex-row gap-5 justify-between items-start md:items-center transition-colors">
                  
                  <div className="flex items-center gap-4 min-w-0">
                    <img 
                      src={otherUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name)}`} 
                      referrerPolicy="no-referrer"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name)}`; }}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm shrink-0" 
                      alt="" 
                    />
                    <div className="min-w-0">
                      <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight truncate flex items-center gap-2">
                        {otherUser.name} <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500">({isMentor ? 'Student' : 'Mentor'})</span>
                      </h3>
                      <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                        {scheduledDate.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })} at {scheduledDate.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })} (IST)
                      </p>
                      <p className="text-[11px] font-black text-brand-600 dark:text-brand-400 mt-1">Duration: {call.durationMinutes} mins • Fee: ₹{call.estimatedCost}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3 w-full md:w-auto shrink-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-3 md:pt-0">
                    <div className="flex items-center gap-2">
                      {call.status === "PENDING" && !isPastPending && <span className="px-3 py-1 bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-xs font-black rounded-full uppercase tracking-wider">Requested</span>}
                      {isPastPending && <span className="px-3 py-1 bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-black rounded-full uppercase tracking-wider">Expired (No Response)</span>}
                      {(call.status === "CONFIRMED" || call.status === "ACCEPTED") && <span className="px-3 py-1 bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30 text-xs font-black rounded-full uppercase tracking-wider">Confirmed</span>}
                      {call.status === "COMPLETED" && <span className="px-3 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black rounded-full uppercase tracking-wider">Completed</span>}
                      {call.status === "RESCHEDULED" && <span className="px-3 py-1 bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-xs font-black rounded-full uppercase tracking-wider">Rescheduled</span>}
                      {call.status === "CANCELLED" && <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-black rounded-full uppercase tracking-wider">Cancelled</span>}
                      {call.status === "REJECTED" && <span className="px-3 py-1 bg-danger/15 text-danger dark:text-red-300 border border-danger/30 text-xs font-black rounded-full uppercase tracking-wider">Rejected</span>}
                      {call.status === "MISSED" && <span className="px-3 py-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-black rounded-full uppercase tracking-wider">Missed</span>}
                      {call.status === "DISPUTED" && <span className="px-3 py-1 bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-black rounded-full uppercase tracking-wider">Disputed</span>}
                    </div>

                    {(call.status === "CONFIRMED" || call.status === "ACCEPTED") && diffMinutes > 5 && (
                      <div className="flex items-center gap-2 text-xs font-black text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                        <Clock className="text-brand-500 text-base" /> Starts in: <CountdownTimer targetDate={call.scheduledAt} />
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {(call.status === "CONFIRMED" || call.status === "ACCEPTED") && (
                        <div className="flex items-center gap-2">
                          {call.meetLink && call.meetLink.startsWith("http") ? (
                            <a
                              href={call.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black rounded-xl flex items-center gap-1.5 shadow-md transition-all hover:scale-105"
                            >
                              <VideoCamera weight="fill" className="text-base" /> Launch Google Meet
                            </a>
                          ) : (
                            <Link 
                              href={`/meetings/${call.id}`} 
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition"
                            >
                              <VideoCamera weight="fill" className="text-base" /> Setup Meeting
                            </Link>
                          )}
                          {call.meetLink && (
                            <Link 
                              href={`/meetings/${call.id}`} 
                              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition"
                              title="View Meeting Details & Lobby"
                            >
                              Details
                            </Link>
                          )}
                        </div>
                      )}

                      {/* Mentor Complete Call Action */}
                      {isMentor && (call.status === "CONFIRMED" || call.status === "ACCEPTED") && diffMinutes < 0 && (
                        <button
                          disabled={processingId === call.id}
                          onClick={() => updateStatus(call.id, "COMPLETED")}
                          className="px-3.5 py-2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 transition-all"
                        >
                          <CheckCircle weight="fill" className="text-emerald-500 text-base" /> Mark Completed
                        </button>
                      )}

                      {!isMentor && (call.status === "CONFIRMED" || call.status === "COMPLETED" || diffMinutes < -call.durationMinutes) && (
                        <button
                          onClick={() => setReviewingMentor({ id: call.mentorId, name: call.mentor.name })}
                          className="px-3.5 py-2 bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 transition-all"
                        >
                          <Star weight="fill" className="text-amber-500 text-base" /> Rate Mentor
                        </button>
                      )}

                      {/* Dispute Button for Student if the session has passed or completed recently */}
                      {!isMentor && (call.status === "CONFIRMED" || call.status === "COMPLETED") && diffMinutes < 60 && (
                        <button
                          disabled={processingId === call.id}
                          onClick={() => {
                            if(confirm("Are you sure you want to dispute this call? This will pause payout and alert an admin.")) {
                              updateStatus(call.id, "DISPUTED");
                            }
                          }}
                          className="px-3.5 py-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 transition-all"
                        >
                          <WarningCircle weight="fill" className="text-rose-500 text-base" /> Report Issue
                        </button>
                      )}

                      {call.status === "PENDING" && isMentor && !isPastPending && (
                        <>
                          <button 
                            disabled={processingId === call.id}
                            onClick={() => updateStatus(call.id, "CONFIRMED")}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl flex items-center gap-1"
                          >
                            <CheckCircle /> Accept
                          </button>
                          <button 
                            disabled={processingId === call.id}
                            onClick={() => updateStatus(call.id, "REJECTED")}
                            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-bold rounded-xl flex items-center gap-1"
                          >
                            <XCircle /> Reject
                          </button>
                        </>
                      )}

                      {(call.status === "PENDING" || call.status === "CONFIRMED" || call.status === "ACCEPTED") && (!isMentor || (isMentor && (call.status === "CONFIRMED" || call.status === "ACCEPTED"))) && (
                        <button 
                          disabled={processingId === call.id}
                          onClick={() => updateStatus(call.id, "CANCELLED")}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl flex items-center gap-1"
                        >
                          <XCircle /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-2">
            <span className="text-sm text-slate-500 font-medium">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalItems)} of {totalItems}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className="px-4 py-2 text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages}
                className="px-4 py-2 text-sm font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <ReviewModal
        mentorId={reviewingMentor?.id || ""}
        mentorName={reviewingMentor?.name || ""}
        isOpen={!!reviewingMentor}
        onClose={() => setReviewingMentor(null)}
        onSuccess={() => {}}
      />
    </div>
  );
}
