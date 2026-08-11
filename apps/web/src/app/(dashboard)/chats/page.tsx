"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  ChatCircleDots, 
  MagnifyingGlass, 
  Plus, 
  Sparkle, 
  ArrowRight,
  ClockCounterClockwise
} from "@phosphor-icons/react";
import { ChatListSkeleton } from "@/components/ui/Skeleton";

interface ChatSession {
  id: string;
  otherUser: { name: string; avatar: string | null };
  lastMessage: string;
  updatedAt: string;
  status: string;
  hasUnread?: boolean;
  durationMinutes?: number;
  totalCharge?: number;
}

export default function ChatsPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await fetch("/api/chats");
        const data = await res.json();
        if (res.ok) {
          setChats(data.chats);
        }
      } catch (err) {
        console.error("Failed to fetch chats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, []);

  const filteredChats = chats.filter((chat) => {
    const matchesSearch = chat.otherUser.name.toLowerCase().includes(search.toLowerCase()) ||
                          chat.lastMessage.toLowerCase().includes(search.toLowerCase());
    if (filter === "ACTIVE") return matchesSearch && chat.status === "ACTIVE";
    if (filter === "COMPLETED") return matchesSearch && chat.status === "COMPLETED";
    return matchesSearch;
  });

  return (
    <div className="w-full min-h-full bg-slate-50 dark:bg-slate-950 py-8 md:py-12 animate-in fade-in">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 space-y-6">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Messages & Sessions
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm max-w-xl">
              Connect instantly with your mentors, manage live discussions, and review previous advice.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/chat-history"
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm transition-all"
            >
              <ClockCounterClockwise weight="bold" className="text-lg" />
              <span>Full History & Logs</span>
            </Link>
            {user?.role === "STUDENT" && (
              <Link 
                href="/dashboard" 
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus weight="bold" className="text-lg" />
                <span>Find Mentor</span>
              </Link>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="relative w-full sm:w-80">
            <MagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button 
              onClick={() => setFilter("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === "ALL" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
            >
              All Sessions
            </button>
            <button 
              onClick={() => setFilter("ACTIVE")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === "ACTIVE" ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
            >
              Live Only
            </button>
            <button 
              onClick={() => setFilter("COMPLETED")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === "COMPLETED" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
            >
              Completed
            </button>
          </div>
        </div>

        {/* Chat Cards List */}
        <div className="space-y-4">
          {loading ? (
            <ChatListSkeleton />
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-16 px-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl rounded-[32px] border border-white/50 dark:border-slate-800/50 shadow-xl space-y-4">
              <div className="w-20 h-20 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-inner">
                <ChatCircleDots weight="fill" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">No Conversations Found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto">
                {search ? "No chats matched your search query." : "You haven't initiated any mentorship chat sessions yet."}
              </p>
              {user?.role === "STUDENT" && (
                <div className="pt-2">
                  <Link 
                    href="/dashboard" 
                    className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-lg"
                  >
                    Browse Available Mentors <ArrowRight weight="bold" />
                  </Link>
                </div>
              )}
            </div>
          ) : (
            filteredChats.map((chat) => (
              <Link 
                key={chat.id}
                href={`/chats/${chat.id}`}
                className={`group relative flex items-center justify-between p-5 rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md ${
                  chat.hasUnread 
                    ? "bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60 hover:border-blue-400" 
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0 relative z-10">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                      <img 
                        src={chat.otherUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.otherUser.name)}&background=random`} 
                        alt={chat.otherUser.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.otherUser.name)}&background=random`; }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {chat.status === "ACTIVE" && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                        {chat.otherUser.name}
                      </h3>
                      {chat.hasUnread && (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white rounded-full">
                          New
                        </span>
                      )}
                      {chat.status === "ACTIVE" ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full">
                          Completed
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${chat.hasUnread ? "text-slate-900 dark:text-white font-semibold" : "text-slate-500 dark:text-slate-400"}`}>
                      {chat.lastMessage || "No messages sent yet."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0 ml-4">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center transition ${chat.hasUnread ? "bg-blue-600 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-100 dark:group-hover:bg-slate-700"}`}>
                    <ArrowRight weight="bold" className="text-[10px]" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
