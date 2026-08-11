"use client";

import { useEffect, useState } from "react";
import { AdminLoader } from "@/components/ui/AdminLoader";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/providers/ToastProvider";

interface Review {
  id: string;
  rating: number;
  comment?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";
  publishedAt: string;
  removalRequested: boolean;
  removalReason?: string;
  createdAt: string;
  student: { name: string; email: string };
  mentor: { user: { name: string } };
}

export default function AdminReviewsPage() {
  const toast = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [page]);

  async function fetchReviews() {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/reviews?page=${page}&limit=${limit}`);
      const data = await res.json();
      if (res.ok && data.reviews) {
        setReviews(data.reviews);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages || 1);
          setTotalReviews(data.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(reviewId: string, status: string) {
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, status }),
      });
      if (res.ok) {
        toast.success(`Review marked as ${status}`);
        fetchReviews();
      } else {
        toast.error("Failed to update review");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Review & Rating Moderation</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Moderate student ratings and handle mentor removal requests (15-min auto-publish buffer).
        </p>
      </div>

      {loading ? (
        <div className="py-12">
          <AdminLoader message="Loading reviews..." />
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 font-medium">
          No reviews submitted yet.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className={`p-5 bg-white dark:bg-slate-900 rounded-2xl border shadow-sm flex flex-col gap-4 transition-all ${
                r.removalRequested
                  ? "border-rose-300 dark:border-rose-800/80 ring-2 ring-rose-500/10"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-black">
                      ★ {r.rating} / 5
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{r.student.name}</span>
                    <span className="text-xs font-semibold text-slate-400">reviewed</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{r.mentor.user.name}</span>
                  </div>
                  {r.comment ? (
                    <p className="text-sm text-slate-700 dark:text-slate-200 mt-2 font-medium leading-relaxed">"{r.comment}"</p>
                  ) : (
                    <p className="text-xs italic text-slate-400 mt-2">No written feedback provided.</p>
                  )}
                  <p className="text-[11px] font-bold text-slate-400 mt-2.5">
                    Submitted: {new Date(r.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} • Scheduled Public:{" "}
                    {new Date(r.publishedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full ${
                      r.status === "APPROVED"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        : r.status === "PENDING"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    {r.status}
                  </span>

                  {r.status !== "APPROVED" && (
                    <button
                      onClick={() => updateStatus(r.id, "APPROVED")}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
                    >
                      Approve
                    </button>
                  )}
                  {r.status !== "HIDDEN" && (
                    <button
                      onClick={() => updateStatus(r.id, "HIDDEN")}
                      className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors"
                    >
                      Hide
                    </button>
                  )}
                </div>
              </div>

              {r.removalRequested && (
                <div className="p-4 bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black text-rose-700 dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wider">
                      🛡️ Mentor Dispute & Removal Request
                    </p>
                    <p className="text-sm text-slate-800 dark:text-slate-200 font-semibold mt-1">
                      Reason: "{r.removalReason || "No explanation provided"}"
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => updateStatus(r.id, "HIDDEN")}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-colors shadow-md"
                    >
                      Remove Review
                    </button>
                    <button
                      onClick={() => updateStatus(r.id, "APPROVED")}
                      className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-extrabold transition-colors shadow-sm"
                    >
                      Dismiss Dispute
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="pt-2">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalReviews}
              pageSize={limit}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}
