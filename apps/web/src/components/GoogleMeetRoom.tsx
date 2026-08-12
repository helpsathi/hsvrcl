"use client";

import { useState } from "react";
import {
  VideoCamera,
  CalendarPlus,
  ArrowSquareOut,
  Copy,
  Check,
  ArrowsClockwise,
  Sparkle,
  ShieldCheck,
  Clock,
  WarningCircle,
  CalendarCheck,
} from "@phosphor-icons/react";

interface GoogleMeetRoomProps {
  title: string;
  subtitle?: string;
  meetLink: string | null;
  scheduledAt?: string | Date;
  durationMinutes?: number;
  isHost?: boolean;
  onUpdateLink?: (link: string) => Promise<void> | void;
  isGenerating?: boolean;
  participantName?: string;
  participantRole?: string;
}

export function GoogleMeetRoom({
  title,
  subtitle,
  meetLink,
  scheduledAt,
  durationMinutes = 60,
  isHost = false,
  onUpdateLink,
  isGenerating = false,
  participantName,
  participantRole,
}: GoogleMeetRoomProps) {
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const isValidMeetLink = !!meetLink;

  const handleCopy = () => {
    if (!meetLink) return;
    navigator.clipboard.writeText(meetLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSync = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (!onUpdateLink) return;
    let newLink = meetLink;
    if (e) {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      newLink = formData.get("linkInput") as string;
    }
    
    if (!newLink) return;

    if (!newLink.startsWith("http://") && !newLink.startsWith("https://")) {
      newLink = `https://${newLink}`;
    }

    setSyncing(true);
    setSyncError(null);
    try {
      await onUpdateLink(newLink);
    } catch (err: any) {
      setSyncError(err.message || "Failed to generate meeting link");
    } finally {
      setSyncing(false);
    }
  };

  const formattedDate = scheduledAt
    ? new Date(scheduledAt).toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800/80 shadow-2xl p-6 md:p-10 text-white backdrop-blur-xl transition-all duration-300">
      {/* Background Decorative Animated Glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-500/15 blur-3xl animate-pulse"></div>
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl"></div>
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-emerald-500/5 blur-3xl"></div>

      <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center text-center">
        {/* Status Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6 shadow-inner">
          <span className={`w-2.5 h-2.5 rounded-full ${isValidMeetLink ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            {isValidMeetLink ? (
              <>
                <ShieldCheck weight="fill" className="text-emerald-400 text-sm" />
                Secure Google Meet Ready
              </>
            ) : (
              <>
                <WarningCircle weight="fill" className="text-amber-400 text-sm" />
                Meeting Setup Required
              </>
            )}
          </span>
        </div>

        {/* Title and Participant Info */}
        <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent mb-2">
          {title}
        </h2>
        {subtitle && <p className="text-sm md:text-base text-indigo-300/80 font-medium mb-6">{subtitle}</p>}

        {/* Details Badges */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8 text-xs md:text-sm text-slate-300">
          {formattedDate && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/50 shadow-sm">
              <Clock weight="duotone" className="text-indigo-400 text-base" />
              <span>{formattedDate}</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/50 shadow-sm">
            <VideoCamera weight="duotone" className="text-emerald-400 text-base" />
            <span>{durationMinutes} mins session</span>
          </div>
          {participantName && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/50 shadow-sm">
              <span className="text-slate-400">{participantRole || "With"}:</span>
              <strong className="text-white font-semibold">{participantName}</strong>
            </div>
          )}
        </div>

        {/* Primary Action Zone */}
        {isValidMeetLink ? (
          <div className="w-full space-y-4 max-w-lg">
            <a
              href={meetLink ? (meetLink.startsWith("http://") || meetLink.startsWith("https://") ? meetLink : `https://${meetLink}`) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center justify-center gap-3 w-full py-4 px-8 rounded-2xl font-bold text-base md:text-lg text-white shadow-xl overflow-hidden transition-all duration-300 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:via-teal-500 hover:to-indigo-500 hover:scale-[1.02] active:scale-[0.98] border border-emerald-400/20"
            >
              <div className="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000"></div>
              <VideoCamera weight="fill" className="text-2xl text-emerald-200 group-hover:rotate-12 transition-transform" />
              <span>Join Meeting Room</span>
              <ArrowSquareOut weight="bold" className="text-xl opacity-75 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>

            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
              <span className="text-xs text-slate-400 truncate font-mono select-all text-left flex-1 pl-2">
                {meetLink}
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors shrink-0"
              >
                {copied ? (
                  <>
                    <Check weight="bold" className="text-emerald-400 text-sm" />
                    <span className="text-emerald-300">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy weight="bold" className="text-sm text-slate-400" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* When Meet Link hasn't been created yet */
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-center shadow-lg backdrop-blur-xl">
            <CalendarPlus weight="duotone" className="text-5xl text-indigo-400 mx-auto mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-white mb-2">Meeting Setup Ready</h3>
            
            {isHost ? (
              <div className="mt-4 text-left">
                <p className="text-xs md:text-sm text-slate-300 mb-4 text-center leading-relaxed">
                  Please provide the meeting link (Zoom, Google Meet, Teams) for this session.
                </p>
                <form onSubmit={handleSync} className="flex flex-col gap-3">
                  <input
                    type="text"
                    required
                    placeholder="meet.google.com/..."
                    defaultValue={meetLink || ""}
                    name="linkInput"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={syncing || isGenerating}
                    className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {syncing || isGenerating ? <ArrowsClockwise className="animate-spin text-lg" /> : <Check className="text-lg" />}
                    Save Meeting Link
                  </button>
                </form>
              </div>
            ) : (
              <p className="text-xs md:text-sm text-slate-300 mb-6 leading-relaxed">
                Waiting for the mentor to provide the meeting room link. Please refresh if you don't see it yet.
              </p>
            )}

            {syncError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left flex items-start gap-2">
                <WarningCircle weight="fill" className="text-rose-400 text-base shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold">Setup Failed</p>
                  <p className="text-[11px] text-rose-200/80 mt-0.5 leading-relaxed">{syncError}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Update Link Section if it already exists */}
        {isValidMeetLink && isHost && onUpdateLink && (
          <div className="mt-8 w-full max-w-lg p-5 rounded-2xl bg-slate-800/50 border border-slate-700 text-left">
            <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wide">
              Update Meeting Link
            </label>
            <form onSubmit={handleSync} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="meet.google.com/..."
                defaultValue={meetLink || ""}
                name="linkInput"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 transition-colors"
              />
              <button
                type="submit"
                disabled={syncing || isGenerating}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shrink-0"
              >
                {syncing || isGenerating ? <ArrowsClockwise className="animate-spin text-lg" /> : <Check className="text-lg" />}
                Update
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
