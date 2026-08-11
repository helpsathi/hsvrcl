"use client";

import { useState } from "react";
import { Star, X, CheckCircle, WarningCircle, Sparkle } from "@phosphor-icons/react";

interface ReviewModalProps {
  mentorId: string;
  mentorName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({ mentorId, mentorName, isOpen, onClose, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId, rating, comment }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit evaluation");
      }

      setSuccess(data.message || "Thank you! Your feedback has been submitted.");
      setComment("");
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess(null);
      }, 1800);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl p-6 sm:p-8 transition-colors">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute right-5 top-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="text-lg font-bold" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Sparkle weight="fill" className="text-amber-500 text-xl animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">Evaluate & Rate</h3>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Mentor: {mentorName}</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mb-6">
          Your authentic rating and review helps fellow students find the right guidance and helps mentors thrive!
        </p>

        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 p-3.5 rounded-2xl text-xs font-bold mb-4">
            <WarningCircle weight="fill" className="text-lg shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 p-3.5 rounded-2xl text-xs font-bold mb-4">
            <CheckCircle weight="fill" className="text-lg shrink-0 text-emerald-500" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Star Rating Selector */}
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Overall Experience Rating
            </label>
            <div className="flex items-center gap-2 py-2 px-4 rounded-2xl bg-slate-100/80 dark:bg-slate-950/80 border border-slate-200/60 dark:border-slate-800/80 w-fit">
              {[1, 2, 3, 4, 5].map((star) => {
                const isHighlighted = star <= (hoverRating || rating);
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none transform hover:scale-125 active:scale-95 transition-transform p-1"
                  >
                    <Star
                      weight={isHighlighted ? "fill" : "regular"}
                      className={`text-2xl sm:text-3xl transition-colors ${
                        isHighlighted
                          ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                          : "text-slate-300 dark:text-slate-700"
                      }`}
                    />
                  </button>
                );
              })}
              <span className="ml-2 font-black text-sm text-slate-800 dark:text-slate-200 min-w-[32px] text-center">
                {hoverRating || rating} / 5
              </span>
            </div>
          </div>

          {/* Comment Textarea */}
          <div>
            <label htmlFor="comment" className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Detailed Feedback (Optional)
            </label>
            <textarea
              id="comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe your mentorship consultation, insights gained, communication style, or problem solving effectiveness..."
              className="w-full rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all resize-none"
              maxLength={500}
            />
            <div className="flex justify-end mt-1">
              <span className="text-[11px] font-bold text-slate-400">
                {comment.length} / 500 characters
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-slate-950 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:opacity-95 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-98 disabled:opacity-60 disabled:scale-100"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-slate-950" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Submitting...
                </>
              ) : (
                <>
                  <Sparkle weight="fill" className="text-base" />
                  Submit Evaluation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
