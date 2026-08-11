"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ChatCircleDots, 
  MagnifyingGlass, 
  Clock, 
  CurrencyInr, 
  Paperclip, 
  ArrowRight, 
  Eye, 
  X, 
  ArrowsClockwise,
  UserCheck
} from "@phosphor-icons/react";

interface ChatSessionItem {
  id: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED" | "EXPIRED" | "PENDING";
  startTime: string;
  endTime?: string;
  perMinuteRate: number;
  totalCharge: number;
  durationMinutes: number;
  isFreeTrial: boolean;
  createdAt: string;
  mentor: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  messages: Array<{
    id: string;
    content: string;
    createdAt: string;
  }>;
  _count: {
    messages: number;
  };
}

interface MessageItem {
  id: string;
  content: string;
  attachments: string[];
  createdAt: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface DetailedSession {
  id: string;
  status: string;
  mentor: { name: string; email: string; avatar?: string };
  messages: MessageItem[];
}

export default function StudentChatHistoryPage() {
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  // Transcript inspection modal
  const [viewSessionId, setViewSessionId] = useState<string | null>(null);
  const [detailedSession, setDetailedSession] = useState<DetailedSession | null>(null);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  async function fetchSessions() {
    setLoading(true);
    try {
      const res = await fetch("/api/chats/history");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (e) {
      console.error("Failed to load chat history:", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  async function openTranscript(sessionId: string) {
    setViewSessionId(sessionId);
    setTranscriptLoading(true);
    try {
      const res = await fetch(`/api/chats/history?sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setDetailedSession(data.session);
      }
    } catch (e) {
      console.error("Failed to load session transcript:", e);
    } finally {
      setTranscriptLoading(false);
    }
  }

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = s.mentor.name.toLowerCase().includes(search.toLowerCase());
    if (filter === "ALL") return matchesSearch;
    if (filter === "ACTIVE") return matchesSearch && s.status === "ACTIVE";
    if (filter === "COMPLETED") return matchesSearch && s.status === "COMPLETED";
    return matchesSearch;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
            <ChatCircleDots weight="fill" /> Mentorship Logs
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-2">
            Chat History
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Review past 1-on-1 chats, guidance notes, and session billing details.
          </p>
        </div>
        <button
          onClick={fetchSessions}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50"
        >
          <ArrowsClockwise weight="bold" className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          {["ALL", "ACTIVE", "COMPLETED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === tab
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab === "ALL" ? "All Chats" : tab === "ACTIVE" ? "Active" : "Completed"}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <MagnifyingGlass weight="bold" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Search by mentor name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Chat Sessions Feed */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <ChatCircleDots className="mx-auto text-4xl text-slate-400" />
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">No chat sessions found</h3>
          <p className="text-xs text-slate-500">Connect with a verified topper to start a live pay-per-minute chat session.</p>
          <Link
            href="/mentors"
            className="inline-block mt-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-sm"
          >
            Find a Mentor
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => {
            const lastMsg = session.messages[0]?.content;
            return (
              <div
                key={session.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-500/40 dark:hover:border-blue-500/40 transition"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                    {session.mentor.avatar ? (
                      <img src={session.mentor.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      session.mentor.name.charAt(0)
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        {session.mentor.name}
                      </h3>
                      {session.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {session.status}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                      {lastMsg ? `"${lastMsg}"` : "No messages recorded"}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{session.durationMinutes} min ({session._count.messages} messages)</span>
                      <span>•</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        ₹{session.totalCharge.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {session.status === "ACTIVE" ? (
                    <Link
                      href={`/chat/${session.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
                    >
                      Resume Chat <ArrowRight weight="bold" />
                    </Link>
                  ) : (
                    <button
                      onClick={() => openTranscript(session.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition"
                    >
                      <Eye weight="bold" /> View Transcript
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transcript Inspection Modal */}
      {viewSessionId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ChatCircleDots weight="bold" className="text-blue-600" />
                  Chat Transcript
                </h3>
                {detailedSession && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mentor: {detailedSession.mentor.name}
                  </p>
                )}
              </div>
              <button
                onClick={() => { setViewSessionId(null); setDetailedSession(null); }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X weight="bold" className="text-lg" />
              </button>
            </div>

            {/* Messages body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-950/50">
              {transcriptLoading ? (
                <div className="text-center py-16 text-slate-400 flex items-center justify-center gap-2">
                  <ArrowsClockwise className="animate-spin text-base" /> Loading messages...
                </div>
              ) : !detailedSession || detailedSession.messages.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  No messages recorded in this chat.
                </div>
              ) : (
                detailedSession.messages.map((m) => (
                  <div key={m.id} className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {m.sender.name}
                      </span>
                      <span className="text-slate-400 text-[10px]">{new Date(m.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{m.content}</p>
                    {m.attachments && m.attachments.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-2">
                        {m.attachments.map((att, i) => (
                          <a
                            key={i}
                            href={att}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-blue-600 underline"
                          >
                            <Paperclip /> Attachment {i + 1}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => { setViewSessionId(null); setDetailedSession(null); }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
