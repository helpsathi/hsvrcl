"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  Megaphone, 
  Sparkle, 
  ChalkboardTeacher, 
  ShieldCheck, 
  Clock, 
  ArrowLeft,
  ArrowsClockwise,
  Plus,
  X,
  PaperPlaneTilt,
  CheckCircle,
  WarningCircle
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  targetAudience: string;
  attachments: string[];
  links: string[];
  createdAt: string;
  mentor?: {
    id: string;
    user: {
      name: string;
      avatar: string | null;
    };
  } | null;
}

export default function AnnouncementsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New Announcement Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newAudience, setNewAudience] = useState("SUBSCRIBERS");
  
  // File upload state
  const [attachments, setAttachments] = useState<string[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  
  // Links state
  const [links, setLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const isMentorOrAdmin = user?.role === "MENTOR" || user?.role === "ADMIN" || user?.adminSubRole;

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (err) {
      console.error("Failed to load announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      setError("Please fill in both title and content.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          targetAudience: newAudience,
          attachments,
          links,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post announcement");
      
      setSuccessMsg("Announcement published successfully!");
      setNewTitle("");
      setNewContent("");
      setAttachments([]);
      setLinks([]);
      setLinkInput("");
      setIsModalOpen(false);
      fetchAnnouncements();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    setError("");

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to upload file");
        uploadedUrls.push(data.url);
      }
      setAttachments((prev) => [...prev, ...uploadedUrls]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingFiles(false);
      // clear input
      e.target.value = "";
    }
  };

  const handleAddLink = () => {
    if (!linkInput.trim()) return;
    try {
      const url = new URL(linkInput.trim());
      setLinks((prev) => [...prev, url.toString()]);
      setLinkInput("");
    } catch (e) {
      setError("Please enter a valid URL starting with http:// or https://");
      setTimeout(() => setError(""), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Megaphone weight="fill" className="text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Announcements & Updates
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              Important news, updates, and schedule broadcasts from your mentors and HelpSathi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isMentorOrAdmin && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
            >
              <Plus weight="bold" /> Create Announcement
            </button>
          )}
          <button
            onClick={fetchAnnouncements}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
          >
            <ArrowsClockwise className={`text-sm ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
          <CheckCircle weight="fill" className="text-lg shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg">
                  <Megaphone weight="fill" />
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">New Announcement</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center text-sm"
              >
                <X weight="bold" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-xl">
                <WarningCircle weight="fill" className="text-base shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Announcement Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Live System Design Q&A Tomorrow at 7 PM"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {user?.role === "ADMIN" ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Target Audience
                  </label>
                  <select
                    value={newAudience}
                    onChange={(e) => setNewAudience(e.target.value)}
                    className="w-full text-xs font-semibold px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="SUBSCRIBERS">Subscribers Only (Active Mentees)</option>
                    <option value="ALL">All Students (Public Feed)</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Target Audience
                  </label>
                  <div className="w-full text-xs font-semibold px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 cursor-not-allowed">
                    Subscribers Only (Active Mentees)
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Content / Details
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Write the full update, guidelines, or meeting instructions here..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full text-xs font-medium px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed resize-none"
                />
              </div>

              {/* Attachments Section */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Attachments (PDFs / Photos)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {attachments.map((url, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 w-16 h-16 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                      {url.toLowerCase().endsWith(".pdf") ? (
                        <span className="text-[10px] font-bold text-slate-500">PDF</span>
                      ) : (
                        <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X weight="bold" />
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  disabled={uploadingFiles}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-950 dark:file:text-indigo-300 disabled:opacity-50"
                />
                {uploadingFiles && <p className="text-[10px] text-indigo-500 font-semibold animate-pulse mt-1">Uploading...</p>}
              </div>

              {/* Links Section */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Action Links (Optional)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    className="flex-1 text-xs font-semibold px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddLink}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-col gap-1.5">
                  {links.map((link, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 truncate">{link}</span>
                      <button
                        type="button"
                        onClick={() => setLinks(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-slate-400 hover:text-rose-500 transition"
                      >
                        <X weight="bold" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-60"
                >
                  {submitting ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Publishing...</>
                  ) : (
                    <><PaperPlaneTilt weight="bold" /> Publish Announcement</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 animate-pulse space-y-3"
            >
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-3/4"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2"></div>
            </div>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto mb-4 text-3xl">
            <Megaphone weight="duotone" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">
            No announcements yet
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
            When mentors or the platform publish new guidance or session broadcasts, they will show up here.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors shadow-md"
          >
            <ArrowLeft /> Return to Dashboard
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => {
            const isPlatform = !item.mentor;
            const date = new Date(item.createdAt);

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${
                    isPlatform
                      ? "from-blue-500 to-indigo-600"
                      : "from-amber-400 via-orange-500 to-rose-500"
                  }`}
                />

                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {isPlatform ? (
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <ShieldCheck weight="fill" className="text-xl" />
                      </div>
                    ) : (
                      <img
                        src={
                          item.mentor?.user.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            item.mentor?.user.name || "Mentor"
                          )}&background=random`
                        }
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            item.mentor?.user.name || "Mentor"
                          )}&background=random`;
                        }}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        alt="Mentor"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {isPlatform ? "HelpSathi Platform" : item.mentor?.user.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isPlatform
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          }`}
                        >
                          {isPlatform ? "Official" : "Mentor"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 font-medium mt-0.5">
                        <Clock className="text-xs" />
                        {date.toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg self-start">
                    Audience: {item.targetAudience}
                  </span>
                </div>

                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {/* Basic auto-link parsing for URLs in text */}
                  {item.content.split(/(https?:\/\/[^\s]+)/g).map((part, i) => 
                    part.match(/^https?:\/\//) ? (
                      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                        {part}
                      </a>
                    ) : part
                  )}
                </p>

                {/* Render Attachments */}
                {item.attachments && item.attachments.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {item.attachments.map((url, i) => (
                      url.toLowerCase().endsWith(".pdf") ? (
                        <a 
                          key={i} 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition"
                        >
                          <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-[10px]">
                            PDF
                          </div>
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">View Document</span>
                        </a>
                      ) : (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:opacity-80 transition">
                          <img src={url} alt="Attachment" className="w-full h-full object-cover" />
                        </a>
                      )
                    ))}
                  </div>
                )}

                {/* Render Links */}
                {item.links && item.links.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.links.map((link, i) => (
                      <a 
                        key={i} 
                        href={link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition"
                      >
                        🔗 {new URL(link).hostname}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
