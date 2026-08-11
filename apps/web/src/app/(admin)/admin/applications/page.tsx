"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  CheckCircle, 
  XCircle, 
  Phone, 
  EnvelopeSimple, 
  User, 
  FileText, 
  LinkedinLogo, 
  CurrencyInr, 
  CalendarCheck, 
  Clock, 
  PencilSimple, 
  FloppyDisk, 
  Eye, 
  ArrowSquareOut, 
  MagnifyingGlass,
  GraduationCap,
  Briefcase,
  Translate,
  Sliders,
  WarningCircle
} from "@phosphor-icons/react";
import { AdminLoader } from "@/components/ui/AdminLoader";
import { Pagination } from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";

interface PendingMentor {
  id: string; // userId
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  createdAt: string;
  mentorProfile: {
    id: string;
    username: string | null;
    bio: string | null;
    linkedinUrl: string | null;
    resumeUrl: string | null;
    categories: string[];
    skills: string[];
    languages: string[];
    experience: number;
    perMinutePrice: number;
    callPricePerMinute: number;
    monthlyPrice: number;
    commissionRate: number | null;
    rejectionReason?: string | null;
    availability: {
      days?: string[];
      from?: string;
      to?: string;
    } | null;
    status: string;
    freeTrial: boolean;
    createdAt: string;
  };
}

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const REJECT_PRESETS = [
  "Incomplete or blurry verification document",
  "Experience / credentials could not be verified",
  "Please re-upload a clear ID or Degree certificate",
  "Consultation rates or weekly schedule need adjustment",
  "Incomplete bio or profile details",
];

export default function AdminApplicationsPage() {
  const [mentors, setMentors] = useState<PendingMentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { addToast, ToastContainer } = useToast();
  
  // Modal State for Reviewing & Editing
  const [selectedMentor, setSelectedMentor] = useState<PendingMentor | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [commissionRate, setCommissionRate] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingChanges, setIsSavingChanges] = useState(false);

  // Rejection Modal State
  const [rejectModalMentor, setRejectModalMentor] = useState<PendingMentor | null>(null);
  const [rejectReason, setRejectReason] = useState("Incomplete or blurry verification document");
  
  // Free Trial State for Approval
  const [freeTrial, setFreeTrial] = useState(false);

  const fetchMentors = async () => {
    try {
      const res = await fetch(`/api/admin/mentors?status=PENDING&page=${page}&limit=20`);
      const data = await res.json();
      if (res.ok) {
        const pending: PendingMentor[] = (data.mentors || []).map((m: any) => ({
          id: m.userId,
          name: m.user?.name || "Unknown User",
          email: m.user?.email || "",
          phone: m.user?.phone || null,
          avatar: m.user?.avatar || null,
          createdAt: m.user?.createdAt || m.createdAt || new Date().toISOString(),
          mentorProfile: {
            id: m.id,
            username: m.username || null,
            bio: m.bio || null,
            linkedinUrl: m.linkedinUrl || null,
            resumeUrl: m.resumeUrl || null,
            categories: Array.isArray(m.categories) ? m.categories : [],
            skills: Array.isArray(m.skills) ? m.skills : [],
            languages: Array.isArray(m.languages) ? m.languages : [],
            experience: m.experience || 0,
            perMinutePrice: m.perMinutePrice ?? 15,
            callPricePerMinute: m.callPricePerMinute ?? (m.perMinutePrice ?? 15),
            monthlyPrice: m.monthlyPrice ?? 0,
            commissionRate: m.commissionRate ?? 30,
            rejectionReason: m.rejectionReason || null,
            availability: m.availability || { days: ["Mon", "Tue", "Wed", "Thu", "Fri"], from: "09:00", to: "18:00" },
            status: m.status || "PENDING",
            freeTrial: m.freeTrial || false,
            createdAt: m.createdAt || new Date().toISOString(),
          }
        }));
        setMentors(pending);
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages);
        }
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to fetch mentor applications", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();
  }, [page]);

  const openReviewModal = (mentor: PendingMentor, editDirectly: boolean = false) => {
    setSelectedMentor(mentor);
    setIsEditing(editDirectly);
    setCommissionRate(mentor.mentorProfile.commissionRate || 30);
    setFreeTrial(mentor.mentorProfile.freeTrial || false);
    setEditFormData({
      name: mentor.name,
      phone: mentor.phone || "",
      email: mentor.email,
      username: mentor.mentorProfile.username || "",
      bio: mentor.mentorProfile.bio || "",
      linkedinUrl: mentor.mentorProfile.linkedinUrl || "",
      resumeUrl: mentor.mentorProfile.resumeUrl || "",
      categories: mentor.mentorProfile.categories.join(", "),
      skills: mentor.mentorProfile.skills.join(", "),
      languages: mentor.mentorProfile.languages.join(", "),
      experience: mentor.mentorProfile.experience,
      perMinutePrice: mentor.mentorProfile.perMinutePrice,
      callPricePerMinute: mentor.mentorProfile.callPricePerMinute,
      monthlyPrice: mentor.mentorProfile.monthlyPrice,
      availabilityDays: mentor.mentorProfile.availability?.days || ["Mon", "Tue", "Wed", "Thu", "Fri"],
      availabilityFrom: mentor.mentorProfile.availability?.from || "09:00",
      availabilityTo: mentor.mentorProfile.availability?.to || "18:00",
    });
  };

  const handleSaveChanges = async () => {
    if (!selectedMentor || !editFormData) return;
    try {
      setIsSavingChanges(true);
      const parsedCategories = editFormData.categories
        ? editFormData.categories.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];
      const parsedSkills = editFormData.skills
        ? editFormData.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];
      const parsedLanguages = editFormData.languages
        ? editFormData.languages.split(",").map((s: string) => s.trim()).filter(Boolean)
        : [];

      const payload = {
        userId: selectedMentor.id,
        name: editFormData.name,
        phone: editFormData.phone,
        email: editFormData.email,
        username: editFormData.username,
        bio: editFormData.bio,
        linkedinUrl: editFormData.linkedinUrl,
        resumeUrl: editFormData.resumeUrl,
        categories: parsedCategories,
        skills: parsedSkills,
        languages: parsedLanguages,
        experience: Number(editFormData.experience) || 0,
        perMinutePrice: Number(editFormData.perMinutePrice) || 0,
        callPricePerMinute: Number(editFormData.callPricePerMinute) || 0,
        monthlyPrice: Number(editFormData.monthlyPrice) || 0,
        commissionRate,
        freeTrial,
        availability: {
          days: editFormData.availabilityDays,
          from: editFormData.availabilityFrom,
          to: editFormData.availabilityTo,
        }
      };

      const res = await fetch("/api/admin/mentors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save changes");
      }

      // Update local state
      const updatedMentor: PendingMentor = {
        ...selectedMentor,
        name: editFormData.name,
        phone: editFormData.phone || null,
        email: editFormData.email,
        mentorProfile: {
          ...selectedMentor.mentorProfile,
          username: editFormData.username || null,
          bio: editFormData.bio,
          linkedinUrl: editFormData.linkedinUrl || null,
          resumeUrl: editFormData.resumeUrl || null,
          categories: parsedCategories,
          skills: parsedSkills,
          languages: parsedLanguages,
          experience: Number(editFormData.experience) || 0,
          perMinutePrice: Number(editFormData.perMinutePrice) || 0,
          callPricePerMinute: Number(editFormData.callPricePerMinute) || 0,
          monthlyPrice: Number(editFormData.monthlyPrice) || 0,
          commissionRate,
          freeTrial,
          availability: {
            days: editFormData.availabilityDays,
            from: editFormData.availabilityFrom,
            to: editFormData.availabilityTo,
          }
        }
      };

      setMentors((prev) => prev.map((m) => (m.id === selectedMentor.id ? updatedMentor : m)));
      setSelectedMentor(updatedMentor);
      setIsEditing(false);
      addToast("Mentor application details updated successfully!", "success");
    } catch (err: any) {
      console.error(err);
      addToast(err.message || "Failed to save application changes", "error");
    } finally {
      setIsSavingChanges(false);
    }
  };

  const initiateReject = (mentor: PendingMentor) => {
    setRejectModalMentor(mentor);
    setRejectReason("Incomplete or blurry verification document");
  };

  const handleConfirmReject = async () => {
    if (!rejectModalMentor) return;
    await handleStatusUpdate(rejectModalMentor.id, "REJECTED", undefined, rejectReason);
    setRejectModalMentor(null);
  };

  const handleStatusUpdate = async (
    userId: string, 
    status: "APPROVED" | "REJECTED", 
    commission?: number,
    reason?: string
  ) => {
    try {
      setIsSubmitting(true);
      // If we are currently editing and approving, save changes first
      if (isEditing && editFormData && status === "APPROVED") {
        await handleSaveChanges();
      }

      const res = await fetch("/api/admin/mentors/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId, 
          status, 
          commissionRate: commission,
          rejectionReason: reason,
          freeTrial
        }),
      });

      if (res.ok) {
        setMentors((prev) => prev.filter((m) => m.id !== userId));
        setSelectedMentor(null);
        setIsEditing(false);
        addToast(`Mentor application successfully ${status.toLowerCase()}!`, "success");
      } else {
        const errorData = await res.json();
        addToast(errorData.error || "Failed to update status", "error");
      }
    } catch (err) {
      console.error(err);
      addToast("Something went wrong updating mentor status", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDaySelection = (day: string) => {
    if (!editFormData) return;
    const current = editFormData.availabilityDays || [];
    const next = current.includes(day)
      ? current.filter((d: string) => d !== day)
      : [...current, day];
    setEditFormData({ ...editFormData, availabilityDays: next });
  };

  const filteredMentors = useMemo(() => {
    if (!searchQuery.trim()) return mentors;
    const q = searchQuery.toLowerCase();
    return mentors.filter((m) => 
      m.name.toLowerCase().includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.phone && m.phone.toLowerCase().includes(q)) ||
      (m.mentorProfile.username && m.mentorProfile.username.toLowerCase().includes(q)) ||
      m.mentorProfile.categories.some((c) => c.toLowerCase().includes(q))
    );
  }, [mentors, searchQuery]);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {ToastContainer}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Mentor Applications</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review, inspect verification documents, modify submitted details, and approve/reject mentors.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full">
            <AdminLoader message="Loading mentor applications..." />
          </div>
        ) : filteredMentors.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-600 dark:text-slate-400 font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
            {searchQuery ? "No applications match your search query." : "No pending applications. You're all caught up!"}
          </div>
        ) : (
          filteredMentors.map((mentor) => (
            <div 
              key={mentor.id} 
              className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Header: Avatar, Name, Phone Number at TOP */}
                <div className="flex items-start gap-3.5 mb-4 pb-3.5 border-b border-slate-100 dark:border-slate-800/60">
                  <img 
                    src={mentor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.name)}&background=random`} 
                    alt={mentor.name}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.name)}&background=random`;
                    }}
                    className="w-13 h-13 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-extrabold text-slate-800 dark:text-slate-200 text-base truncate">{mentor.name}</h3>
                      {mentor.mentorProfile.username && (
                        <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-2 py-0.5 rounded-full">
                          @{mentor.mentorProfile.username}
                        </span>
                      )}
                    </div>

                    {/* PHONE NUMBER PROMINENTLY AT TOP */}
                    <div className="flex items-center gap-1.5 mt-1 text-slate-700 dark:text-slate-300 font-semibold text-xs">
                      <Phone weight="fill" className="text-emerald-500 text-sm flex-shrink-0" />
                      <span className="truncate">{mentor.phone ? mentor.phone : <span className="text-slate-400 font-normal italic">No phone added</span>}</span>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-1.5 mt-0.5 text-slate-500 dark:text-slate-400 text-xs">
                      <EnvelopeSimple weight="bold" className="text-slate-400 text-xs flex-shrink-0" />
                      <span className="truncate">{mentor.email}</span>
                    </div>
                  </div>
                </div>

                {/* Categories & Experience */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Categories</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                      {mentor.mentorProfile.experience} Yrs Exp
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {mentor.mentorProfile.categories && mentor.mentorProfile.categories.length > 0 ? (
                      mentor.mentorProfile.categories.map((cat) => (
                        <span key={cat} className="bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 px-2.5 py-1 rounded-lg text-xs font-bold border border-brand-200/50 dark:border-brand-500/20">
                          {cat}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No categories selected</span>
                    )}
                  </div>

                  {/* Pricing Overview Pills */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Chat</span>
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">₹{mentor.mentorProfile.perMinutePrice}/m</span>
                    </div>
                    <div className="text-center border-x border-slate-200 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Call</span>
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">₹{mentor.mentorProfile.callPricePerMinute}/m</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Sub</span>
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">₹{mentor.mentorProfile.monthlyPrice}/mo</span>
                    </div>
                  </div>

                  {/* Verification Document Badge */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400 font-medium">Verification Doc:</span>
                    {mentor.mentorProfile.resumeUrl ? (
                      <a 
                        href={mentor.mentorProfile.resumeUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        <FileText weight="bold" /> View Doc <ArrowSquareOut weight="bold" />
                      </a>
                    ) : (
                      <span className="text-amber-500 font-bold">Not Uploaded</span>
                    )}
                  </div>

                  {/* Bio Preview */}
                  {mentor.mentorProfile.bio && (
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed bg-slate-50/50 dark:bg-slate-800/30 p-2 rounded-lg">
                        "{mentor.mentorProfile.bio}"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                {/* View Details Primary Button */}
                <button
                  onClick={() => openReviewModal(mentor, false)}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:opacity-90 transition-all"
                >
                  <Eye weight="bold" className="text-sm" /> View & Edit Full Details
                </button>

                <div className="flex gap-2">
                  <button 
                    onClick={() => openReviewModal(mentor, false)}
                    className="flex-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-emerald-500 hover:text-white transition-colors border border-emerald-200 dark:border-emerald-500/20"
                  >
                    <CheckCircle weight="bold" className="text-base" /> Approve
                  </button>
                  <button 
                    onClick={() => initiateReject(mentor)}
                    disabled={isSubmitting}
                    className="flex-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:bg-rose-500 hover:text-white transition-colors border border-rose-200 dark:border-rose-500/20 disabled:opacity-50"
                  >
                    <XCircle weight="bold" className="text-base" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Comprehensive Application Details & Edit Modal */}
      {selectedMentor && editFormData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl shadow-2xl relative my-8 overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-start gap-4">
                <img 
                  src={selectedMentor.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMentor.name)}&background=random`} 
                  alt={selectedMentor.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMentor.name)}&background=random`;
                  }}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-brand-500/20 shadow-md"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                      {isEditing ? editFormData.name : selectedMentor.name}
                    </h2>
                    {(selectedMentor.mentorProfile.username || editFormData.username) && (
                      <span className="text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-500/10 px-2.5 py-0.5 rounded-full border border-brand-200/50">
                        @{isEditing ? editFormData.username : selectedMentor.mentorProfile.username}
                      </span>
                    )}
                    <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Pending Application
                    </span>
                  </div>

                  {/* PHONE NUMBER AT TOP OF MODAL */}
                  <div className="flex items-center gap-3 mt-1.5 flex-wrap text-sm">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                      <Phone weight="fill" className="text-sm" />
                      <span>{isEditing ? (editFormData.phone || "No phone") : (selectedMentor.phone || "No phone provided")}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs font-medium">
                      <EnvelopeSimple weight="bold" className="text-slate-400" />
                      <span>{isEditing ? editFormData.email : selectedMentor.email}</span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-400 text-xs">
                      <Clock weight="bold" />
                      <span>Applied: {new Date(selectedMentor.mentorProfile.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Action Controls: Edit Toggle & Close */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                    isEditing 
                      ? "bg-amber-500 text-white border-amber-600 shadow-md" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <PencilSimple weight="bold" /> {isEditing ? "Editing Mode" : "Edit Details"}
                </button>
                <button 
                  onClick={() => {
                    setSelectedMentor(null);
                    setIsEditing(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                >
                  <XCircle weight="fill" className="text-2xl" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">

              {/* Verification & Identity Proof Box */}
              <div className="bg-gradient-to-br from-brand-500/5 to-purple-500/5 dark:from-brand-500/10 dark:to-purple-500/10 p-5 rounded-2xl border border-brand-500/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText weight="bold" className="text-brand-500 text-lg" /> Verification & Credentials
                  </h3>
                  {selectedMentor.mentorProfile.linkedinUrl && (
                    <a
                      href={selectedMentor.mentorProfile.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                    >
                      <LinkedinLogo weight="fill" className="text-base" /> LinkedIn Profile <ArrowSquareOut weight="bold" />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Document Box */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold">
                        <FileText className="text-xl" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Resume / ID Proof</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {selectedMentor.mentorProfile.resumeUrl ? "Document attached" : "No document uploaded"}
                        </p>
                      </div>
                    </div>

                    {selectedMentor.mentorProfile.resumeUrl ? (
                      <a
                        href={selectedMentor.mentorProfile.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-brand-600 hover:bg-brand-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                      >
                        <Eye weight="bold" /> Open Doc
                      </a>
                    ) : (
                      <span className="text-xs font-bold text-amber-500">Missing</span>
                    )}
                  </div>

                  {/* LinkedIn / External Link */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                        <LinkedinLogo className="text-xl" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">LinkedIn Profile</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                          {selectedMentor.mentorProfile.linkedinUrl || "Not provided"}
                        </p>
                      </div>
                    </div>

                    {selectedMentor.mentorProfile.linkedinUrl ? (
                      <a
                        href={selectedMentor.mentorProfile.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all border border-blue-200 dark:border-blue-500/20"
                      >
                        Visit <ArrowSquareOut weight="bold" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">None</span>
                    )}
                  </div>
                </div>
              </div>

              {/* EDIT MODE FORM vs VIEW MODE */}
              {isEditing ? (
                /* EDIT FORM */
                <div className="space-y-4 bg-slate-50/70 dark:bg-slate-950/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <PencilSimple weight="bold" /> Edit Submitted Information
                    </h4>
                    <span className="text-xs text-slate-500">Admin can modify any field before approval</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Full Name</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Phone Number</label>
                      <input
                        type="text"
                        placeholder="+91 9876543210"
                        value={editFormData.phone}
                        onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Username Handle (@)</label>
                      <input
                        type="text"
                        placeholder="mentor_handle"
                        value={editFormData.username}
                        onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Categories (comma separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. UPSC / BPSC, SSC CGL"
                        value={editFormData.categories}
                        onChange={(e) => setEditFormData({ ...editFormData, categories: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Skills (comma separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. GS Paper 1, Essay Writing"
                        value={editFormData.skills}
                        onChange={(e) => setEditFormData({ ...editFormData, skills: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Languages (comma separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. English, Hindi"
                        value={editFormData.languages}
                        onChange={(e) => setEditFormData({ ...editFormData, languages: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Experience (Years)</label>
                      <input
                        type="number"
                        min="0"
                        value={editFormData.experience}
                        onChange={(e) => setEditFormData({ ...editFormData, experience: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Chat Rate (₹/min)</label>
                      <input
                        type="number"
                        min="0"
                        value={editFormData.perMinutePrice}
                        onChange={(e) => setEditFormData({ ...editFormData, perMinutePrice: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Call Rate (₹/min)</label>
                      <input
                        type="number"
                        min="0"
                        value={editFormData.callPricePerMinute}
                        onChange={(e) => setEditFormData({ ...editFormData, callPricePerMinute: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Monthly Sub (₹/mo)</label>
                      <input
                        type="number"
                        min="0"
                        value={editFormData.monthlyPrice}
                        onChange={(e) => setEditFormData({ ...editFormData, monthlyPrice: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">LinkedIn URL</label>
                      <input
                        type="text"
                        placeholder="https://linkedin.com/in/..."
                        value={editFormData.linkedinUrl}
                        onChange={(e) => setEditFormData({ ...editFormData, linkedinUrl: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Verification Document / Resume URL</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={editFormData.resumeUrl}
                        onChange={(e) => setEditFormData({ ...editFormData, resumeUrl: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  {/* Availability Days Selection */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1.5">Available Days</label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_DAYS.map((day) => {
                        const active = (editFormData.availabilityDays || []).includes(day);
                        return (
                          <button
                            type="button"
                            key={day}
                            onClick={() => toggleDaySelection(day)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                              active
                                ? "bg-brand-500 text-white shadow-sm"
                                : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300"
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Available Hours */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Time From</label>
                      <input
                        type="time"
                        value={editFormData.availabilityFrom}
                        onChange={(e) => setEditFormData({ ...editFormData, availabilityFrom: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Time To</label>
                      <input
                        type="time"
                        value={editFormData.availabilityTo}
                        onChange={(e) => setEditFormData({ ...editFormData, availabilityTo: e.target.value })}
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">Bio / Profile Description</label>
                    <textarea
                      rows={3}
                      value={editFormData.bio}
                      onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  {/* Save Changes Button */}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
                    >
                      Cancel Edit
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveChanges}
                      disabled={isSavingChanges}
                      className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2 text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <FloppyDisk weight="bold" /> {isSavingChanges ? "Saving..." : "Save Changes to Profile"}
                    </button>
                  </div>
                </div>
              ) : (
                /* VIEW MODE SECTIONS */
                <div className="space-y-6">
                  {/* Bio */}
                  <div>
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">About / Bio</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 leading-relaxed">
                      {selectedMentor.mentorProfile.bio || <span className="text-slate-400 italic">No bio provided.</span>}
                    </p>
                  </div>

                  {/* Categories, Skills & Languages */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Categories</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedMentor.mentorProfile.categories && selectedMentor.mentorProfile.categories.length > 0 ? (
                          selectedMentor.mentorProfile.categories.map((c) => (
                            <span key={c} className="bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 px-2 py-0.5 rounded-lg text-xs font-bold">
                              {c}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">None selected</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Skills & Topics</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedMentor.mentorProfile.skills && selectedMentor.mentorProfile.skills.length > 0 ? (
                          selectedMentor.mentorProfile.skills.map((s) => (
                            <span key={s} className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-lg text-xs font-semibold">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">None listed</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Languages</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedMentor.mentorProfile.languages && selectedMentor.mentorProfile.languages.length > 0 ? (
                          selectedMentor.mentorProfile.languages.map((l) => (
                            <span key={l} className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-lg text-xs font-semibold">
                              {l}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">None listed</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pricing Breakdown & Availability Schedule */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pricing */}
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-3">Consultation Rates</span>
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">💬 Chat Price:</span>
                          <span className="font-extrabold text-slate-900 dark:text-white">₹{selectedMentor.mentorProfile.perMinutePrice} / min</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">📞 1:1 Call Price:</span>
                          <span className="font-extrabold text-slate-900 dark:text-white">₹{selectedMentor.mentorProfile.callPricePerMinute} / min</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-600 dark:text-slate-400 font-medium">📅 Monthly Mentorship:</span>
                          <span className="font-extrabold text-slate-900 dark:text-white">₹{selectedMentor.mentorProfile.monthlyPrice} / month</span>
                        </div>
                      </div>
                    </div>

                    {/* Availability Schedule */}
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-3">Availability Schedule</span>
                      <div className="space-y-2.5">
                        <div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">Active Days:</span>
                          <div className="flex flex-wrap gap-1">
                            {ALL_DAYS.map((d) => {
                              const active = (selectedMentor.mentorProfile.availability?.days || []).includes(d);
                              return (
                                <span
                                  key={d}
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                    active
                                      ? "bg-brand-500 text-white"
                                      : "bg-slate-200 dark:bg-slate-800 text-slate-400 opacity-60"
                                  }`}
                                >
                                  {d}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
                          <span className="text-slate-500 dark:text-slate-400">Hours:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {selectedMentor.mentorProfile.availability?.from || "09:00"} - {selectedMentor.mentorProfile.availability?.to || "18:00"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Commission Rate Slider for Approval */}
              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-5 rounded-2xl border border-emerald-500/20">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <label className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sliders weight="bold" className="text-emerald-600" /> Platform Commission Rate
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Percentage deducted by HelpSathi on consultations</p>
                  </div>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{commissionRate}%</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="80" 
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-1.5 text-[11px] font-bold text-slate-400">
                  <span>10% (Low)</span>
                  <span>30% (Standard)</span>
                  <span>80% (High)</span>
                </div>
              </div>

              {/* Free Trial Toggle */}
              <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between mt-4">
                <div>
                  <label className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CheckCircle weight="bold" className={freeTrial ? "text-emerald-500" : "text-slate-400"} /> 
                    Free Trial Chats
                    {selectedMentor?.mentorProfile?.freeTrial && (
                      <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20 px-2 py-0.5 rounded-full ml-1">
                        Requested
                      </span>
                    )}
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Allow mentor to offer initial free chat sessions to new students.</p>
                </div>
                <div className="relative">
                  <input 
                    type="checkbox" 
                    checked={freeTrial}
                    onChange={(e) => setFreeTrial(e.target.checked)}
                    className="sr-only" 
                  />
                  <div className={`block w-12 h-7 rounded-full transition-colors cursor-pointer ${freeTrial ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`} onClick={() => setFreeTrial(!freeTrial)}></div>
                  <div className={`absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform pointer-events-none ${freeTrial ? 'transform translate-x-5' : ''} shadow-sm`}></div>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between gap-4">
              <button
                onClick={() => initiateReject(selectedMentor)}
                disabled={isSubmitting || isSavingChanges}
                className="bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 px-6 py-3 rounded-2xl text-sm font-bold border border-rose-200 dark:border-rose-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <XCircle weight="bold" className="text-lg" /> Reject Application
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedMentor(null);
                    setIsEditing(false);
                  }}
                  className="px-5 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-all"
                >
                  Close
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedMentor.id, "APPROVED", commissionRate)}
                  disabled={isSubmitting || isSavingChanges}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl text-sm font-black shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? "Approving..." : "Approve & Activate Mentor"} <CheckCircle weight="bold" className="text-lg" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectModalMentor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative border border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 flex items-center justify-center text-2xl">
                  <WarningCircle weight="fill" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Reject Application</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Applicant: {rejectModalMentor.name} ({rejectModalMentor.email})</p>
                </div>
              </div>
              <button 
                onClick={() => setRejectModalMentor(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <XCircle weight="fill" className="text-2xl" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
              Please specify the reason for rejecting this application. This feedback will be sent directly to the applicant so they can fix their details and re-apply immediately.
            </p>

            {/* Quick Presets */}
            <div className="mb-4">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Common Reasons (Click to select)</label>
              <div className="flex flex-wrap gap-1.5">
                {REJECT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectReason(preset)}
                    className={`text-xs px-2.5 py-1 rounded-xl text-left font-medium transition-all ${
                      rejectReason === preset
                        ? "bg-rose-500 text-white shadow-sm font-bold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea for custom reason */}
            <div className="mb-6">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Detailed Reason / Feedback</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain what the applicant needs to update or provide..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
              />
            </div>

            {/* Modal Buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectModalMentor(null)}
                className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isSubmitting || !rejectReason.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2.5 text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? "Rejecting..." : "Confirm & Send Feedback"} <XCircle weight="bold" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}