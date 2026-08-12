"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Plus, VideoCamera, Users, CalendarBlank, Spinner, CheckCircle, WarningCircle, ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface GroupMeeting {
  id: string;
  title: string;
  description: string | null;
  meetLink: string;
  scheduledAt: string;
  createdAt: string;
  _count?: { attendees: number };
}

export default function MentorGroupMeetingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [meetings, setMeetings] = useState<GroupMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    durationMinutes: 60,
    meetLink: ""
  });

  useEffect(() => {
    if (!user) return;
    if (user.role !== "MENTOR" && user.role !== "ADMIN") {
      router.push("/mentor-dashboard");
      return;
    }
    fetchMeetings();
    fetchProfile();
  }, [user, activeTab, page]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/mentors/profile`);
      const data = await res.json();
      if (res.ok && data.profile?.personalMeetingLink) {
        setFormData(prev => ({ ...prev, meetLink: data.profile.personalMeetingLink }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/mentors/group-meetings?filter=${activeTab}&page=${page}&limit=${limit}`);
      const data = await res.json();
      if (res.ok) {
        setMeetings(data.meetings || []);
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

  const cancelMeeting = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this meeting? This will delete the Google Meet event.")) return;
    setCancellingId(id);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/mentors/group-meetings/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to cancel meeting");
      setSuccess("Meeting cancelled successfully");
      fetchMeetings();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");
    setSuccess("");

    try {
      const scheduledAt = new Date(`${formData.date}T${formData.time}`);
      
      const res = await fetch("/api/mentors/group-meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          scheduledAt: scheduledAt.toISOString(),
          durationMinutes: formData.durationMinutes,
          meetLink: formData.meetLink
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create group meeting");

      setSuccess("Group meeting created! Subscribers have been notified.");
      
      // Preserve the meetLink for the next meeting they create
      setFormData({ title: "", description: "", date: "", time: "", durationMinutes: 60, meetLink: formData.meetLink });
      fetchMeetings();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <Spinner className="animate-spin text-4xl text-brand-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/mentor-dashboard" className="p-2 bg-white rounded-full border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
          <ArrowLeft className="text-lg text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Users weight="fill" className="text-brand-500" /> Group Meetings
          </h1>
          <p className="text-slate-500 text-sm">Schedule exclusive sessions for your subscribers.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Create Form */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Plus weight="bold" className="text-brand-500" /> Schedule New
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl mb-6 text-sm font-semibold flex items-center gap-2">
              <WarningCircle weight="fill" className="text-lg shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-700 border border-green-200 p-3 rounded-xl mb-6 text-sm font-semibold flex items-center gap-2">
              <CheckCircle weight="fill" className="text-lg shrink-0" />
              {success}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Topic</label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="E.g., Q&A Session, React Masterclass..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all font-medium"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Description (Optional)</label>
              <textarea 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="What will you cover?"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all font-medium min-h-[100px] resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Meeting Link</label>
              <input 
                type="url" 
                required
                value={formData.meetLink}
                onChange={e => setFormData({...formData, meetLink: e.target.value})}
                placeholder="https://meet.google.com/abc-defg-hij"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all font-medium"
              />
              <p className="text-[10px] text-slate-400 mt-1">Paste your Zoom, Google Meet, or Teams link here.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Date</label>
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">Time</label>
                <input 
                  type="time" 
                  required
                  value={formData.time}
                  onChange={e => setFormData({...formData, time: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full bg-brand-main text-brand-900 py-3.5 rounded-xl font-bold mt-2 shadow-sm hover:bg-brand-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {creating ? <><Spinner className="animate-spin text-xl" /> Creating...</> : "Schedule Meeting"}
            </button>
          </form>
        </div>

        {/* Meetings List */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <CalendarBlank weight="bold" className="text-slate-500" /> Meetings
            </h2>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {(["upcoming", "past"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setPage(1); }}
                  className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all capitalize ${activeTab === tab ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          
          {meetings.length === 0 && !loading ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center">
              <Users className="text-4xl text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-500">No upcoming meetings</p>
              <p className="text-xs text-slate-400 mt-1">Schedule one to engage with your subscribers.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {meetings.map(m => (
                <div key={m.id} className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group ${activeTab === 'past' ? 'opacity-75' : ''}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-slate-800">{m.title}</h3>
                      <p className="text-xs font-semibold text-brand-600 mt-1">
                        {new Date(m.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    {m._count && typeof m._count.attendees === 'number' && (
                      <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                        <Users weight="fill" /> {m._count.attendees}
                      </span>
                    )}
                  </div>
                  {m.description && <p className="text-xs text-slate-500 mb-4 line-clamp-2">{m.description}</p>}
                  
                  <div className="flex gap-2">
                    {activeTab === 'upcoming' && (
                      <Link 
                        href={`/group-meetings/${m.id}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-50 text-indigo-700 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors"
                      >
                        <VideoCamera weight="fill" className="text-lg" /> Join Meeting
                      </Link>
                    )}
                    {activeTab === 'upcoming' && (
                      <button
                        onClick={() => cancelMeeting(m.id)}
                        disabled={cancellingId === m.id}
                        className="px-4 py-2.5 rounded-xl font-bold text-sm text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        {cancellingId === m.id ? '...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 px-2">
                  <span className="text-sm text-slate-500 font-medium">
                    Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalItems)} of {totalItems}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setPage(p => Math.max(1, p - 1))} 
                      disabled={page === 1}
                      className="px-3 py-1 text-sm font-bold bg-white border border-slate-200 disabled:opacity-50 rounded-xl hover:bg-slate-50"
                    >Prev</button>
                    <button 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                      disabled={page === totalPages}
                      className="px-3 py-1 text-sm font-bold bg-white border border-slate-200 disabled:opacity-50 rounded-xl hover:bg-slate-50"
                    >Next</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
