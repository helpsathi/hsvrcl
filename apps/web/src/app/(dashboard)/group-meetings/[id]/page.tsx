"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { WarningCircle, Users, ArrowLeft } from "@phosphor-icons/react";
import { GoogleMeetRoom } from "@/components/GoogleMeetRoom";
import Link from "next/link";

interface GroupMeeting {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  meetLink: string;
  mentorId: string;
  durationMinutes?: number;
  mentor: { id: string; name: string; avatar: string | null; email?: string };
}

export default function GroupMeetingRoomPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [meeting, setMeeting] = useState<GroupMeeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchMeeting = async () => {
      try {
        const res = await fetch(`/api/mentors/group-meetings/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setMeeting(data.meeting);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMeeting();
  }, [id, user]);

  const handleUpdateLink = async (newLink: string) => {
    try {
      const res = await fetch(`/api/mentors/group-meetings/${id}/meet-link`, { 
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetLink: newLink })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update meeting link");
      if (data.meeting) {
        setMeeting(data.meeting);
        toast.success("Meeting link updated successfully! 🔗");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to sync link");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading group meeting...</p>
        </div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950 p-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full border border-slate-200 dark:border-slate-800">
          <WarningCircle weight="fill" className="text-6xl text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Error</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{error || "Meeting not found"}</p>
          <Link href="/dashboard" className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold w-full block transition-colors">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  const isHost = user?.id === meeting.mentorId;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-4 py-3 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center gap-4 z-30 shrink-0">
        <button 
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="text-xl" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
            <Users weight="fill" className="text-xl" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white leading-tight">
              {meeting.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Hosted by {meeting.mentor.name}
            </p>
          </div>
        </div>
      </div>

      {/* Video Area / Lobby */}
      <div className="flex-1 w-full bg-slate-950 p-4 pb-32 md:p-6 lg:p-8 flex items-center justify-center overflow-y-auto">
        <div className="w-full h-auto max-w-4xl mx-auto">
          <GoogleMeetRoom
            title={meeting.title}
            subtitle={meeting.description || `Exclusive group session hosted by ${meeting.mentor.name}`}
            meetLink={meeting.meetLink}
            scheduledAt={meeting.scheduledAt}
            durationMinutes={meeting.durationMinutes ?? 60}
            isHost={isHost}
            onUpdateLink={handleUpdateLink}
            participantName={meeting.mentor.name}
            participantRole="Host"
          />
        </div>
      </div>
    </div>
  );
}
