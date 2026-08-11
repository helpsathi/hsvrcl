"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { Calendar, PaperPlaneTilt, Trash, Plus, Users, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import ScheduleMessageModal from "@/components/ScheduleMessageModal";

interface ScheduledMessage {
  id: string;
  content: string;
  targetAudience: string;
  targetStudentIds: string[];
  attachments: string[];
  scheduledAt: string;
  status: string;
  createdAt: string;
}

export default function ScheduledMessagesTab() {
  const { user } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancelingMsgId, setCancelingMsgId] = useState<string | null>(null);
  const [cancelingLoading, setCancelingLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchMessages();
    }
  }, [user]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mentors/${user?.id}/scheduled-messages`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.scheduledMessages || []);
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setLoading(false);
    }
  };

  const confirmCancelMessage = async () => {
    if (!cancelingMsgId) return;
    setCancelingLoading(true);
    try {
      const res = await fetch(`/api/mentors/${user?.id}/scheduled-messages/${cancelingMsgId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("Scheduled message cancelled successfully");
        setCancelingMsgId(null);
        fetchMessages();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to cancel scheduled message");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel message. Please try again.");
    } finally {
      setCancelingLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "PENDING":
        return <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-600 border border-amber-200"><Calendar weight="bold" /> Scheduled</span>;
      case "SENT":
        return <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200"><CheckCircle weight="bold" /> Sent</span>;
      case "CANCELLED":
        return <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-50 text-slate-500 border border-slate-200"><WarningCircle weight="bold" /> Cancelled</span>;
      case "FAILED":
        return <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-600 border border-red-200"><WarningCircle weight="bold" /> Failed</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const getAudienceLabel = (audience: string, ids: string[]) => {
    if (audience === "ALL_SUBSCRIBERS") return "All Active Subscribers";
    if (audience === "ALL_PAST_STUDENTS") return "All Past & Current Students";
    if (audience === "SPECIFIC") return `Specific Students (${ids.length})`;
    return audience;
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <PaperPlaneTilt weight="fill" className="text-amber-500" /> Broadcasts & Scheduled Messages
          </h2>
          <p className="text-sm text-slate-500 mt-1">Broadcast announcements or share files with your students.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-amber-500/20 active:scale-95 transition-all"
        >
          <Plus weight="bold" /> Schedule New Message
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {messages.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <Calendar weight="duotone" className="text-3xl" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Scheduled Messages</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm">You haven't scheduled any broadcasts yet. Schedule a message to keep your students updated!</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-amber-50 text-amber-600 font-semibold rounded-xl hover:bg-amber-100 transition-colors"
            >
              Schedule Now
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {messages.map((msg) => (
              <div key={msg.id} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getStatusBadge(msg.status)}
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {new Date(msg.scheduledAt).toLocaleString(undefined, {
                        weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2">
                    {msg.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users weight="bold" /> {getAudienceLabel(msg.targetAudience, msg.targetStudentIds)}
                    </span>
                    {msg.attachments.length > 0 && (
                      <span className="flex items-center gap-1 text-indigo-500">
                        • {msg.attachments.length} Attachment{msg.attachments.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                
                {msg.status === "PENDING" && (
                  <button
                    onClick={() => setCancelingMsgId(msg.id)}
                    className="shrink-0 flex items-center justify-center p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                    title="Cancel Message"
                  >
                    <Trash weight="bold" className="text-lg" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <ScheduleMessageModal 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => {
            setIsModalOpen(false);
            fetchMessages();
          }} 
        />
      )}

      <ConfirmationModal
        isOpen={!!cancelingMsgId}
        onClose={() => setCancelingMsgId(null)}
        onConfirm={confirmCancelMessage}
        title="Cancel Scheduled Broadcast"
        message="Are you sure you want to cancel this scheduled message? It will not be sent to your subscribers."
        confirmText="Cancel Broadcast"
        isDanger={true}
        loading={cancelingLoading}
      />
    </div>
  );
}
