"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  CalendarPlus, Users, Clock, CheckCircle, XCircle, ArrowLeft,
  Sparkle, WarningCircle, CalendarCheck, VideoCamera, ArrowsClockwise
} from "@phosphor-icons/react";
import Link from "next/link";

interface Subscriber {
  id: string;
  name: string;
  avatar: string | null;
  email: string;
  subscriptionEndDate: string;
}

interface Proposal {
  id: string;
  title: string;
  description: string | null;
  proposedAt: string;
  durationMinutes: number;
  targetType: string;
  targetStudentIds: string[];
  expiresAt: string;
  status: string;
  createdAt: string;
  acceptances: {
    id: string;
    student: { id: string; name: string; avatar: string | null; email: string };
    scheduledChatId: string | null;
    isFree: boolean;
    acceptedAt: string;
  }[];
}

const DURATION_OPTIONS = [15, 30, 45, 60];

export default function MentorProposalsPage() {
  const { user } = useAuth();

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [proposedAt, setProposedAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [targetType, setTargetType] = useState<"ALL" | "SELECTED">("ALL");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [expiresInHours, setExpiresInHours] = useState(48);

  const [activePage, setActivePage] = useState(1);
  const [pastPage, setPastPage] = useState(1);
  const itemsPerPage = 5;

  const fetchData = async () => {
    try {
      const [subRes, propRes] = await Promise.all([
        fetch("/api/mentors/profile"),
        fetch("/api/mentors/session-proposals"),
      ]);
      const [subData, propData] = await Promise.all([subRes.json(), propRes.json()]);
      if (subRes.ok) setSubscribers(subData.subscribers || []);
      if (propRes.ok) setProposals(propData.proposals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "MENTOR" || user?.role === "ADMIN" || user?.adminSubRole) {
      fetchData();
    } else if (user) {
      setLoading(false);
    }
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/mentors/session-proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          proposedAt: new Date(proposedAt).toISOString(),
          durationMinutes,
          targetType,
          targetStudentIds: targetType === "SELECTED" ? selectedStudents : [],
          expiresInHours,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create proposal");
      setMessage({ type: "success", text: `Proposal created! ${data.notifiedCount} subscriber${data.notifiedCount !== 1 ? "s" : ""} notified.` });
      setShowForm(false);
      setTitle(""); setDescription(""); setProposedAt(""); setSelectedStudents([]);
      await fetchData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setCreating(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const toggleStudent = (id: string) => {
    setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const openProposals = proposals.filter(p => p.status === "OPEN" && new Date(p.expiresAt) > new Date() && new Date(p.proposedAt) > new Date());
  const pastProposals = proposals.filter(p => p.status !== "OPEN" || new Date(p.expiresAt) <= new Date() || new Date(p.proposedAt) <= new Date());
  
  const activePaginated = openProposals.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);
  const pastPaginated = pastProposals.slice((pastPage - 1) * itemsPerPage, pastPage * itemsPerPage);
  
  const totalActivePages = Math.ceil(openProposals.length / itemsPerPage);
  const totalPastPages = Math.ceil(pastProposals.length / itemsPerPage);

  return (
    <div className="w-full min-h-full bg-slate-50 dark:bg-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/mentor-dashboard" className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <ArrowLeft className="text-xl" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">Session Proposals</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Offer dedicated time slots to your subscribers — they book for free</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
          >
            <CalendarPlus weight="fill" className="text-base" />
            {showForm ? "Cancel" : "New Session Proposal"}
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className={`flex items-center gap-3 rounded-2xl p-4 border font-semibold text-sm ${message.type === "success" ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300" : "bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300"}`}>
            {message.type === "success" ? <CheckCircle weight="fill" className="text-xl shrink-0" /> : <WarningCircle weight="fill" className="text-xl shrink-0" />}
            {message.text}
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-indigo-200/60 dark:border-indigo-800/40 shadow-xl p-6 space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <Sparkle weight="fill" className="text-indigo-500 text-xl" />
              <h2 className="font-extrabold text-slate-900 dark:text-white text-lg">Create a Session Proposal</h2>
            </div>
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Session Title *</label>
                  <input
                    required value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Career Q&A Session, Resume Review Call"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Session Date & Time (IST) *</label>
                  <input
                    required type="datetime-local" value={proposedAt} onChange={e => setProposedAt(e.target.value)}
                    min={new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Description (optional)</label>
                <textarea
                  value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="What will you cover in this session? Any prerequisites?"
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Duration</label>
                  <div className="flex gap-2">
                    {DURATION_OPTIONS.map(d => (
                      <button key={d} type="button" onClick={() => setDurationMinutes(d)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${durationMinutes === d ? "bg-indigo-600 text-white shadow-md" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"}`}
                      >{d}m</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Proposal Expires In</label>
                  <select value={expiresInHours} onChange={e => setExpiresInHours(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value={12}>12 hours</option>
                    <option value={24}>24 hours</option>
                    <option value={48}>48 hours</option>
                    <option value={72}>3 days</option>
                  </select>
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Who can accept this?</label>
                <div className="flex gap-3 mb-4">
                  {(["ALL", "SELECTED"] as const).map(t => (
                    <button key={t} type="button" onClick={() => { setTargetType(t); setSelectedStudents([]); }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${targetType === t ? "bg-indigo-600 border-indigo-600 text-white shadow-md" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300"}`}
                    >
                      {t === "ALL" ? <><Users className="text-base" /> All Subscribers</> : <><CheckCircle className="text-base" /> Selected Students</>}
                    </button>
                  ))}
                </div>

                {targetType === "SELECTED" && subscribers.length > 0 && (
                  <div className="grid sm:grid-cols-2 gap-2">
                    {subscribers.map(sub => (
                      <button key={sub.id} type="button" onClick={() => toggleStudent(sub.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedStudents.includes(sub.id) ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 dark:border-indigo-700" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-300"}`}
                      >
                        <img src={sub.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(sub.name)}`} className="w-9 h-9 rounded-xl object-cover" alt={sub.name} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{sub.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{sub.email}</p>
                        </div>
                        {selectedStudents.includes(sub.id) && <CheckCircle weight="fill" className="text-indigo-500 text-lg shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
                {targetType === "SELECTED" && subscribers.length === 0 && (
                  <p className="text-sm text-slate-500 p-4 rounded-xl bg-slate-100 dark:bg-slate-800">No active subscribers found.</p>
                )}
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl p-4 flex items-start gap-3 border border-indigo-100 dark:border-indigo-800/50">
                <Sparkle weight="fill" className="text-indigo-500 text-lg shrink-0 mt-0.5" />
                <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                  Subscribers who accept this proposal will be booked for <strong>FREE</strong>. A Google Meet link will be automatically generated and sent to both of you via Google Calendar.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={creating || (targetType === "SELECTED" && selectedStudents.length === 0)}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-lg disabled:opacity-60 transition-all"
                >
                  {creating ? <><ArrowsClockwise className="animate-spin text-lg" /> Creating...</> : <><CalendarPlus weight="fill" className="text-lg" /> Propose Session</>}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Active Proposals */}
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <CalendarCheck weight="fill" className="text-indigo-500 text-xl" />
            Active Proposals ({openProposals.length})
          </h2>
          {openProposals.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-sm">
              <CalendarPlus className="text-4xl text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">No active proposals. Create one to offer your subscribers a free session!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activePaginated.map(p => (
                <div key={p.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-start gap-3 justify-between">
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white">{p.title}</h3>
                      {p.description && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{p.description}</p>}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                          <Clock className="text-sm" /> {new Date(p.proposedAt).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })} IST
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg">
                          <VideoCamera className="text-sm" /> {p.durationMinutes} min Google Meet
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2.5 py-1 rounded-lg">
                          <Users className="text-sm" /> {p.targetType === "ALL" ? "All subscribers" : `${p.targetStudentIds.length} selected`}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{p.acceptances.length}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">accepted</p>
                    </div>
                  </div>
                  {p.acceptances.length > 0 && (
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Accepted by</p>
                      <div className="flex flex-wrap gap-2">
                        {p.acceptances.map(a => (
                          <div key={a.id} className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 rounded-xl px-3 py-1.5">
                            <img src={a.student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(a.student.name)}`} className="w-6 h-6 rounded-full object-cover" alt={a.student.name} />
                            <span className="text-xs font-bold text-slate-900 dark:text-white">{a.student.name}</span>
                            {a.isFree && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">FREE</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {totalActivePages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-slate-500">Showing {((activePage - 1) * itemsPerPage) + 1} to {Math.min(activePage * itemsPerPage, openProposals.length)} of {openProposals.length}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setActivePage(p => Math.max(1, p - 1))} 
                      disabled={activePage === 1}
                      className="px-3 py-1 text-sm bg-slate-100 disabled:opacity-50 rounded-lg hover:bg-slate-200"
                    >Prev</button>
                    <button 
                      onClick={() => setActivePage(p => Math.min(totalActivePages, p + 1))} 
                      disabled={activePage === totalActivePages}
                      className="px-3 py-1 text-sm bg-slate-100 disabled:opacity-50 rounded-lg hover:bg-slate-200"
                    >Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Past Proposals */}
        {pastProposals.length > 0 && (
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white mb-3 text-slate-400 dark:text-slate-600">Past Proposals ({pastProposals.length})</h2>
            <div className="space-y-2">
              {pastPaginated.map(p => (
                <div key={p.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex items-center justify-between opacity-60">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{p.title}</p>
                    <p className="text-xs text-slate-500">{new Date(p.proposedAt).toLocaleDateString("en-IN")} • {p.acceptances.length} accepted</p>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">{p.status}</span>
                </div>
              ))}
              {totalPastPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-slate-500">Showing {((pastPage - 1) * itemsPerPage) + 1} to {Math.min(pastPage * itemsPerPage, pastProposals.length)} of {pastProposals.length}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setPastPage(p => Math.max(1, p - 1))} 
                      disabled={pastPage === 1}
                      className="px-3 py-1 text-sm bg-slate-100 disabled:opacity-50 rounded-lg hover:bg-slate-200"
                    >Prev</button>
                    <button 
                      onClick={() => setPastPage(p => Math.min(totalPastPages, p + 1))} 
                      disabled={pastPage === totalPastPages}
                      className="px-3 py-1 text-sm bg-slate-100 disabled:opacity-50 rounded-lg hover:bg-slate-200"
                    >Next</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
