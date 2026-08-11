"use client";

import { useState, useRef, useEffect } from "react";
import { X, CalendarPlus, Paperclip, CheckCircle, WarningCircle, UploadSimple, Spinner, UserCircle } from "@phosphor-icons/react";
import { useAuth } from "@/components/providers/AuthProvider";

export default function ScheduleMessageModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [targetAudience, setTargetAudience] = useState("ALL_SUBSCRIBERS");
  const [scheduledAt, setScheduledAt] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [targetStudentIds, setTargetStudentIds] = useState<string[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // Fetch students if they select SPECIFIC
  useEffect(() => {
    if (targetAudience === "SPECIFIC" && students.length === 0) {
      setIsLoadingStudents(true);
      fetch("/api/mentors/students")
        .then(res => res.json())
        .then(data => {
          if (data.success) setStudents(data.students);
        })
        .catch(err => console.error("Failed to fetch students", err))
        .finally(() => setIsLoadingStudents(false));
    }
  }, [targetAudience, students.length]);

  const handleFileAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("Attachment file size exceeds 10MB limit.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to upload attachment");
      }

      setAttachments(prev => [...prev, data.url]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to upload attachment. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !scheduledAt) {
      setError("Message content and scheduled time are required.");
      return;
    }

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      setError("Scheduled time must be in the future.");
      return;
    }

    if (targetAudience === "SPECIFIC" && targetStudentIds.length === 0) {
      setError("Please select at least one student.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/mentors/${user?.id}/scheduled-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          targetAudience,
          scheduledAt: scheduledDate.toISOString(),
          attachments,
          targetStudentIds: targetAudience === "SPECIFIC" ? targetStudentIds : []
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to schedule message");

      onSuccess();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">
              <CalendarPlus weight="fill" className="text-xl" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Schedule Message</h2>
              <p className="text-xs text-slate-500">Broadcast to your students automatically.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X weight="bold" className="text-xl" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
              <WarningCircle weight="bold" className="text-lg shrink-0" />
              {error}
            </div>
          )}

          <form id="schedule-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Message Content</label>
              <textarea
                required
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Target Audience</label>
              <select
                value={targetAudience}
                onChange={e => setTargetAudience(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              >
                <option value="ALL_SUBSCRIBERS">All Active Subscribers</option>
                <option value="ALL_PAST_STUDENTS">All Past & Current Students</option>
                <option value="SPECIFIC">Specific Students</option>
              </select>
            </div>

            {targetAudience === "SPECIFIC" && (
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                  Select Students <span className="text-amber-600 dark:text-amber-400">({targetStudentIds.length} selected)</span>
                </label>
                {isLoadingStudents ? (
                  <div className="flex items-center justify-center p-4">
                    <Spinner className="animate-spin text-amber-500 text-xl" />
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-sm text-slate-500 italic text-center p-2">No students found.</div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                    {students.map(student => (
                      <label key={student.id} className="flex items-center gap-3 p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600">
                        <input
                          type="checkbox"
                          checked={targetStudentIds.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTargetStudentIds(prev => [...prev, student.id]);
                            } else {
                              setTargetStudentIds(prev => prev.filter(id => id !== student.id));
                            }
                          }}
                          className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500 dark:border-slate-600 dark:bg-slate-700"
                        />
                        {student.avatar ? (
                          <img src={student.avatar} alt={student.name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <UserCircle weight="fill" className="w-8 h-8 text-slate-400" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{student.name}</p>
                          <p className="text-xs text-slate-500 truncate">{student.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Scheduled Date & Time</label>
              <input
                type="datetime-local"
                required
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Attachments (Optional)</label>
              
              {attachments.length > 0 && (
                <div className="mb-3 space-y-2">
                  {attachments.map((url, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 px-3 text-sm">
                      <span className="truncate flex-1 text-slate-600 dark:text-slate-300 flex items-center gap-2">
                        <Paperclip /> Attachment {i + 1}
                      </span>
                      <button type="button" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-600 p-1">
                        <X weight="bold" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="relative">
                <label className={`w-full flex items-center justify-center gap-2 py-3 bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm font-medium cursor-pointer ${isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  {isUploading ? <Spinner className="animate-spin" /> : <UploadSimple weight="bold" />}
                  {isUploading ? "Uploading..." : "Click to add an attachment"}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    disabled={isUploading}
                    onChange={handleFileAttachment}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="schedule-form"
            disabled={isSubmitting || isUploading}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? "Scheduling..." : "Schedule Message"}
          </button>
        </div>

      </div>
    </div>
  );
}
