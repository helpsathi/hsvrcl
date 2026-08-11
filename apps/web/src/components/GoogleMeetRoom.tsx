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
  onGenerateLink?: () => Promise<void> | void;
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
  onGenerateLink,
  isGenerating = false,
  participantName,
  participantRole,
}: GoogleMeetRoomProps) {
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const isValidMeetLink = meetLink && meetLink.startsWith("http");

  const handleCopy = () => {
    if (!meetLink) return;
    navigator.clipboard.writeText(meetLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSync = async () => {
    if (!onGenerateLink) return;
    setSyncing(true);
    setSyncError(null);
    try {
      await onGenerateLink();
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
              href={meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex items-center justify-center gap-3 w-full py-4 px-8 rounded-2xl font-bold text-base md:text-lg text-white shadow-xl overflow-hidden transition-all duration-300 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:via-teal-500 hover:to-indigo-500 hover:scale-[1.02] active:scale-[0.98] border border-emerald-400/20"
            >
              <div className="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000"></div>
              <VideoCamera weight="fill" className="text-2xl text-emerald-200 group-hover:rotate-12 transition-transform" />
              <span>Launch Google Meet</span>
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

            {/* Sync / Regeneration Trigger for both Mentors and Students */}
            {onGenerateLink && (
              <div className="pt-4">
                <button
                  onClick={handleSync}
                  disabled={syncing || isGenerating}
                  className="inline-flex items-center gap-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50 group"
                >
                  <ArrowsClockwise
                    weight="bold"
                    className={`text-sm transition-transform ${syncing || isGenerating ? "animate-spin" : "group-hover:rotate-45"}`}
                  />
                  <span>
                    {syncing || isGenerating
                      ? "Synchronizing with Google Calendar..."
                      : "Regenerate Google Meet Link & Sync Calendar Invite"}
                  </span>
                </button>
                <p className="text-[11px] text-slate-500 mt-1">
                  Both mentor and student can re-sync calendar invites anytime.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* When Meet Link hasn't been created yet or is a legacy Jitsi string */
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-center shadow-lg backdrop-blur-xl">
            <CalendarPlus weight="duotone" className="text-5xl text-indigo-400 mx-auto mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-white mb-2">Google Meet Setup Ready</h3>
            <p className="text-xs md:text-sm text-slate-300 mb-6 leading-relaxed">
              Click below to immediately generate a Google Meet video link and automatically attach formal invitations to both the mentor&apos;s and student&apos;s Google Calendars.
            </p>

            {syncError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left flex items-start gap-2">
                <WarningCircle weight="fill" className="text-rose-400 text-base shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold">Setup Failed</p>
                  <p className="text-[11px] text-rose-200/80 mt-0.5 leading-relaxed">{syncError}</p>
                </div>
              </div>
            )}

            {onGenerateLink ? (
              <button
                onClick={handleSync}
                disabled={syncing || isGenerating}
                className="relative w-full py-3.5 px-6 rounded-xl font-bold text-sm md:text-base text-white shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2.5 border border-indigo-400/30"
              >
                {syncing || isGenerating ? (
                  <>
                    <ArrowsClockwise weight="bold" className="text-lg animate-spin text-indigo-200" />
                    <span>Generating Google Meet...</span>
                  </>
                ) : (
                  <>
                    <Sparkle weight="fill" className="text-lg text-amber-300 animate-pulse" />
                    <span>Generate Meet Link & Calendar Invite</span>
                  </>
                )}
              </button>
            ) : (
              <p className="text-xs font-semibold text-rose-400">
                Please wait for the appointment confirmation to generate the link.
              </p>
            )}
          </div>
        )}

        {/* Footer Note */}
        <div className="mt-8 pt-6 border-t border-slate-800/60 w-full flex items-center justify-center gap-2 text-slate-400 text-xs font-medium">
          <CalendarCheck weight="fill" className="text-indigo-400 text-sm" />
          <span>Google Calendar & Meet integration active for Mentor & Student</span>
        </div>
      </div>
    </div>
  );
}
