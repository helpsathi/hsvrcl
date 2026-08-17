"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  ChalkboardTeacher,
  ArrowLeft,
  WarningCircle,
  CheckCircle,
  Info,
  Sparkle,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import Link from "next/link";
import { validateUsernameSyntax } from "@/lib/username";

const onboardingUsernameCache = new Map<
  string,
  { available: boolean; error?: string }
>();

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function MentorOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Previous Application Status State
  const [applicationStatus, setApplicationStatus] = useState<string | null>(
    null,
  );
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [isReapplying, setIsReapplying] = useState(false);

  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");

  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [categoriesList, setCategoriesList] = useState<string[]>([
    "UPSC / BPSC",
    "Software Engineering",
    "JEE / NEET",
    "Govt Exams",
    "Placement Prep",
    "Startup / Biz",
  ]);

  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    category: "UPSC / BPSC",
    skills: "",
    languages: "English, Hindi",
    experience: "0",
    perMinutePrice: "15",
    callPricePerMinute: "15",
    monthlyPrice: "0",
    freeTrial: false,
    linkedinUrl: "",
    resumeUrl: "",
    availability: {
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"] as string[],
      from: "09:00",
      to: "18:00",
    },
    socialMedia: [] as { platform: string; url: string; followerBracket: string }[],
  });

  // Fetch Existing Application Status & Profile Data
  useEffect(() => {
    const fetchExistingStatus = async () => {
      try {
        const res = await fetch("/api/mentors/my-status");
        if (res.ok) {
          const data = await res.json();
          if (data.hasApplied && data.status) {
            setApplicationStatus(data.status);
            setRejectionReason(data.rejectionReason || null);

            if (data.status === "APPROVED") {
              router.replace("/mentor-dashboard");
              return;
            }

            if (data.status === "REJECTED" || data.status === "PENDING") {
              setIsReapplying(true);
              if (data.profile) {
                const p = data.profile;
                setFormData({
                  username: p.username || "",
                  bio: p.bio || "",
                  category:
                    Array.isArray(p.categories) && p.categories.length > 0
                      ? p.categories[0]
                      : "UPSC / BPSC",
                  skills: Array.isArray(p.skills) ? p.skills.join(", ") : "",
                  languages: Array.isArray(p.languages)
                    ? p.languages.join(", ")
                    : "English, Hindi",
                  experience: String(p.experience || 0),
                  perMinutePrice: String(p.perMinutePrice || 15),
                  callPricePerMinute: String(
                    p.callPricePerMinute || p.perMinutePrice || 15,
                  ),
                  monthlyPrice: String(p.monthlyPrice || 0),
                  freeTrial: p.freeTrial || false,
                  linkedinUrl: p.linkedinUrl || "",
                  resumeUrl: p.resumeUrl || "",
                  availability: p.availability || {
                    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
                    from: "09:00",
                    to: "18:00",
                  },
                  socialMedia: Array.isArray(p.socialMedia) ? p.socialMedia : [],
                });
                if (p.resumeUrl) {
                  setUploadedFileName(
                    "Previously Submitted Verification Document",
                  );
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to check existing mentor status:", err);
      } finally {
        setPageLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.categories) && data.categories.length > 0) {
            const names = data.categories
              .map((c: any) => c.name)
              .filter(Boolean);
            if (names.length > 0) {
              setCategoriesList(names);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch platform categories:", err);
      }
    };

    fetchCategories();
    fetchExistingStatus();
  }, [router]);

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size exceeds 10MB limit.");
      return;
    }

    setUploadingDoc(true);
    setUploadError("");

    try {
      const uploadData = new FormData();
      uploadData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Failed to upload document.");
      }

      setFormData((prev) => ({ ...prev, resumeUrl: data.url }));
      setUploadedFileName(file.name);
      setUploadError("");
    } catch (err: any) {
      console.error("Document upload error:", err);
      setUploadError(
        err.message || "Failed to upload document. Please try again.",
      );
    } finally {
      setUploadingDoc(false);
    }
  };

  useEffect(() => {
    const username = formData.username.trim().toLowerCase();
    if (!username) {
      setUsernameError("");
      setUsernameAvailable(false);
      setUsernameChecking(false);
      return;
    }

    // 1. Instant Synchronous Client-Side Syntax & Blocklist Validation
    const validation = validateUsernameSyntax(username);
    if (!validation.isValid) {
      setUsernameError(validation.error || "Invalid username format");
      setUsernameAvailable(false);
      setUsernameChecking(false);
      return;
    }

    // 2. Check Session Cache
    if (onboardingUsernameCache.has(username)) {
      const cached = onboardingUsernameCache.get(username)!;
      setUsernameAvailable(cached.available);
      setUsernameError(cached.error || "");
      setUsernameChecking(false);
      return;
    }

    setUsernameChecking(true);
    setUsernameError("");
    setUsernameAvailable(false);

    // 3. Setup AbortController
    const abortController = new AbortController();

    // 4. Debounced Server Check
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/mentors/check-username?username=${encodeURIComponent(username)}`,
          { signal: abortController.signal },
        );
        const data = await res.json();

        if (!res.ok && res.status === 429) {
          setUsernameAvailable(false);
          setUsernameError(
            data.error || "Too many attempts. Please pause for a moment.",
          );
          return;
        }

        if (data.available) {
          setUsernameAvailable(true);
          setUsernameError("");
          onboardingUsernameCache.set(username, { available: true });
        } else {
          setUsernameAvailable(false);
          setUsernameError(data.error || "Username unavailable");
          onboardingUsernameCache.set(username, {
            available: false,
            error: data.error || "Username unavailable",
          });
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          setUsernameError("Error checking availability");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setUsernameChecking(false);
        }
      }
    }, 650);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [formData.username]);

  const isLinkedInRequired = ["Software Engineering", "Startup / Biz"].includes(
    formData.category,
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDayToggle = (day: string) => {
    setFormData((prev) => {
      const days = prev.availability.days.includes(day)
        ? prev.availability.days.filter((d) => d !== day)
        : [...prev.availability.days, day];
      return { ...prev, availability: { ...prev.availability, days } };
    });
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      availability: { ...prev.availability, [e.target.name]: e.target.value },
    }));
  };
  const handleSocialMediaAdd = () => {
    if (formData.socialMedia.length >= 6) return;
    setFormData((prev) => ({
      ...prev,
      socialMedia: [...prev.socialMedia, { platform: "youtube", url: "", followerBracket: "0 - 1K" }],
    }));
  };

  const handleSocialMediaRemove = (index: number) => {
    setFormData((prev) => {
      const updated = [...prev.socialMedia];
      updated.splice(index, 1);
      return { ...prev, socialMedia: updated };
    });
  };

  const handleSocialMediaChange = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const updated = [...prev.socialMedia];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, socialMedia: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.resumeUrl) {
      setError("Please upload your Resume/ID verification document.");
      return;
    }

    if (formData.availability.days.length === 0) {
      setError("Please select at least one available day.");
      return;
    }

    if (formData.username && (usernameError || !usernameAvailable)) {
      // If it's the user's own current username, allow proceeding
      // Otherwise require validation
    }

    setLoading(true);

    try {
      const payload = {
        username: formData.username.trim().toLowerCase() || undefined,
        bio: formData.bio,
        categories: [formData.category],
        skills: formData.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        languages: formData.languages
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        experience: Number(formData.experience),
        perMinutePrice: Number(formData.perMinutePrice),
        callPricePerMinute: Number(formData.callPricePerMinute),
        monthlyPrice: Number(formData.monthlyPrice) || 0,
        linkedinUrl: formData.linkedinUrl || undefined,
        resumeUrl: formData.resumeUrl,
        availability: formData.availability,
        freeTrial: formData.freeTrial,
        socialMedia: formData.socialMedia,
      };

      const res = await fetch("/api/mentors/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to submit application");

      setSuccess(true);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-col w-full min-h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-36 lg:pb-16 bg-transparent transition-colors">
      <div className="px-0 py-3 flex items-center border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md z-20">
        <Link
          href="/dashboard"
          className="p-2 -ml-2 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="text-xl" />
        </Link>
        <h2 className="text-sm font-bold text-slate-800 dark:text-white ml-2 tracking-tight">
          {isReapplying ? "Update Mentor Application" : "Apply as Mentor"}
        </h2>
      </div>

      <div className="py-6 sm:py-8 space-y-6 sm:space-y-8">
        <div className="text-center max-w-3xl mx-auto">
          <div className="w-16 h-16 bg-brand-100 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm border border-brand-200 dark:border-brand-800/60">
            <ChalkboardTeacher weight="fill" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight leading-tight">
            {isReapplying
              ? "Update & Re-submit Your Application"
              : "Monetize Your Expertise"}
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xl mx-auto">
            {isReapplying
              ? "Review the feedback below, make the necessary corrections, and re-submit your profile immediately."
              : "Join our network of elite mentors and help students succeed."}
          </p>
        </div>

        {/* Rejection Feedback Alert Box */}
        {applicationStatus === "REJECTED" && rejectionReason && (
          <div className="bg-rose-500/10 border-2 border-rose-500/30 text-rose-800 dark:text-rose-300 p-5 rounded-3xl shadow-md max-w-4xl mx-auto space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center gap-2 font-extrabold text-base text-rose-700 dark:text-rose-400">
              <WarningCircle weight="fill" className="text-2xl flex-shrink-0" />
              <span>Admin Review Feedback</span>
            </div>
            <p className="text-sm font-bold text-rose-950 dark:text-rose-100 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
              &ldquo;{rejectionReason}&rdquo;
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              💡 Please update the requested fields or re-upload your document
              below and click{" "}
              <span className="font-bold underline">
                Update &amp; Re-submit Application
              </span>
              . You do not need to wait — your updated profile will be reviewed
              immediately.
            </p>
          </div>
        )}

        {/* Pending Review Notice */}
        {applicationStatus === "PENDING" && (
          <div className="bg-amber-500/10 border-2 border-amber-500/30 text-amber-800 dark:text-amber-300 p-4 rounded-3xl shadow-sm max-w-4xl mx-auto flex items-center gap-3">
            <Info weight="fill" className="text-2xl text-amber-600 shrink-0" />
            <p className="text-xs font-semibold leading-relaxed">
              Your application is currently pending admin review. You can make
              adjustments to your details below and re-submit at any time.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-danger/10 text-danger p-4 rounded-2xl text-sm font-bold leading-relaxed max-w-4xl mx-auto border border-danger/20 shadow-md">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6 sm:space-y-7 max-w-6xl mx-auto"
        >
          <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            {/* Basic Details Container */}
            <div className="space-y-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl transition-colors">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight border-b border-slate-100 dark:border-slate-800/80 pb-3">
                Basic Details
              </h3>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 leading-tight flex flex-wrap items-center justify-between gap-1">
                  <span>Mentor Username / Custom Handle</span>
                  <span className="text-[11px] font-mono font-normal text-slate-400">
                    helpsathi.com/mentors/
                    {formData.username.trim().toLowerCase() || "handle"}
                  </span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                    @
                  </span>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-10 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all lowercase font-medium"
                    placeholder="e.g. rahul_k (optional)"
                    maxLength={20}
                  />
                  {usernameChecking && (
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {!usernameChecking &&
                    usernameAvailable &&
                    formData.username && (
                      <CheckCircle
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-success text-lg"
                        weight="fill"
                      />
                    )}
                  {!usernameChecking && usernameError && formData.username && (
                    <WarningCircle
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-danger text-lg"
                      weight="fill"
                    />
                  )}
                </div>
                {usernameError && (
                  <p className="text-[11px] font-bold text-danger mt-1.5 flex items-center gap-1">
                    <WarningCircle weight="fill" /> {usernameError}
                  </p>
                )}
                {usernameAvailable && !usernameChecking && (
                  <p className="text-[11px] font-bold text-success mt-1.5 flex items-center gap-1">
                    <CheckCircle weight="fill" /> Username available for
                    claiming!
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 leading-tight">
                  Primary Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all font-medium"
                >
                  {categoriesList.map((cat, i) => (
                    <option key={i} value={cat}>
                      {cat}
                    </option>
                  ))}
                  {!categoriesList.includes(formData.category) &&
                    formData.category !== "Other" &&
                    formData.category && (
                      <option value={formData.category}>
                        {formData.category}
                      </option>
                    )}
                  <option value="Other">Other</option>
                </select>
              </div>

              {isLinkedInRequired ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 leading-tight">
                    LinkedIn Profile URL <span className="text-danger">*</span>
                  </label>
                  <input
                    type="url"
                    name="linkedinUrl"
                    required
                    value={formData.linkedinUrl}
                    onChange={handleChange}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all"
                    placeholder="https://linkedin.com/in/username"
                  />
                  <p className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 mt-1.5 leading-relaxed">
                    Required for verification in {formData.category}.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 leading-tight">
                    LinkedIn Profile URL{" "}
                    <span className="text-slate-400 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="url"
                    name="linkedinUrl"
                    value={formData.linkedinUrl}
                    onChange={handleChange}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 leading-tight">
                  Skills & Topics (Comma separated)
                </label>
                <input
                  type="text"
                  name="skills"
                  required
                  value={formData.skills}
                  onChange={handleChange}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all"
                  placeholder="e.g. GS Paper 1, Optional Maths, Essay"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 leading-tight">
                  Languages Spoken (Comma separated)
                </label>
                <input
                  type="text"
                  name="languages"
                  required
                  value={formData.languages}
                  onChange={handleChange}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all"
                  placeholder="e.g. English, Hindi, Bengali"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 leading-tight">
                  Years of Experience
                </label>
                <input
                  type="number"
                  name="experience"
                  min="0"
                  required
                  value={formData.experience}
                  onChange={handleChange}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 leading-tight">
                  Bio & Achievements
                </label>
                <textarea
                  name="bio"
                  rows={4}
                  required
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all leading-relaxed"
                  placeholder="Share your journey, rank, qualifications, and how you can help students..."
                />
              </div>
            </div>

            {/* Pricing & Verification Container */}
            <div className="space-y-6">
              {/* Pricing Container */}
              <div className="space-y-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl transition-colors">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  Consultation Pricing
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 leading-tight">
                      💬 Chat Rate (₹ / min)
                    </label>
                    <input
                      type="number"
                      name="perMinutePrice"
                      min="5"
                      required
                      value={formData.perMinutePrice}
                      onChange={handleChange}
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 leading-tight">
                      📞 1:1 Call Rate (₹ / min)
                    </label>
                    <input
                      type="number"
                      name="callPricePerMinute"
                      min="5"
                      required
                      value={formData.callPricePerMinute}
                      onChange={handleChange}
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 leading-tight">
                    📅 Monthly Mentorship Pass (₹ / month)
                  </label>
                  <input
                    type="number"
                    name="monthlyPrice"
                    min="0"
                    value={formData.monthlyPrice}
                    onChange={handleChange}
                    className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-all"
                  />
                  <p className="text-[11px] font-medium text-slate-400 mt-1.5">
                    Optional. Set to 0 if you only offer per-minute chat/call.
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        name="freeTrial"
                        checked={formData.freeTrial}
                        onChange={(e) => setFormData(prev => ({ ...prev, freeTrial: e.target.checked }))}
                        className="sr-only" 
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${formData.freeTrial ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                      <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.freeTrial ? 'transform translate-x-4' : ''} shadow-sm`}></div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Offer Free Trial Chats</div>
                      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Allow new students to chat with you for free for their first few minutes.</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Availability Container */}
              <div className="space-y-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl transition-colors">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  Weekly Availability
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 leading-tight">
                    Select Active Days
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => {
                      const selected = formData.availability.days.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayToggle(day)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            selected
                              ? "bg-brand-600 text-white shadow-sm"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Active From
                    </label>
                    <input
                      type="time"
                      name="from"
                      value={formData.availability.from}
                      onChange={handleTimeChange}
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Active To
                    </label>
                    <input
                      type="time"
                      name="to"
                      value={formData.availability.to}
                      onChange={handleTimeChange}
                      className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              {/* Verification Container */}
              <div className="space-y-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl transition-colors">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  Verification
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 leading-tight">
                    Upload Resume or ID <span className="text-danger">*</span>
                  </label>

                  <div className="relative">
                    {formData.resumeUrl ? (
                      <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-2xl text-emerald-700 dark:text-emerald-300 shadow-sm min-w-0">
                        <CheckCircle
                          weight="fill"
                          className="text-xl shrink-0 text-emerald-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate leading-tight text-slate-900 dark:text-white">
                            {uploadedFileName || "Document Attached"}
                          </p>
                          <a
                            href={formData.resumeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold underline text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 leading-tight inline-block mt-0.5"
                          >
                            View Uploaded File
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, resumeUrl: "" }));
                            setUploadedFileName("");
                          }}
                          className="text-xs font-bold text-slate-400 hover:text-danger px-2.5 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <label
                        className={`flex items-center gap-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl overflow-hidden relative cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/70 transition-colors shadow-xs ${uploadingDoc ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <div className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-extrabold text-xs py-2.5 px-4 rounded-xl shrink-0 flex items-center gap-2">
                          {uploadingDoc ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
                              <span>Uploading...</span>
                            </>
                          ) : (
                            "Choose File"
                          )}
                        </div>
                        <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 truncate leading-tight">
                          {uploadingDoc
                            ? "Uploading verification document..."
                            : "PDF, PNG, JPG, or WEBP (Max 10MB)"}
                        </p>

                        <input
                          type="file"
                          accept="image/*,application/pdf,.pdf"
                          disabled={uploadingDoc}
                          onChange={handleDocumentUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                      </label>
                    )}
                  </div>

                  {uploadError && (
                    <p className="text-xs text-danger mt-1.5 font-bold flex items-center gap-1.5">
                      <WarningCircle weight="fill" /> {uploadError}
                    </p>
                  )}
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1.5 leading-relaxed">
                    Upload one PDF containing your Resume and any one ID (Aadhaar/PAN/Voter ID).
                  </p>
                </div>
              </div>

              {/* Social Media Container */}
              <div className="space-y-5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl transition-colors">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white tracking-tight">
                    Social Media Presence <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                  </h3>
                  {formData.socialMedia.length < 6 && (
                    <button
                      type="button"
                      onClick={handleSocialMediaAdd}
                      className="flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 bg-brand-50 dark:bg-brand-950/40 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus weight="bold" /> Add Account
                    </button>
                  )}
                </div>

                {formData.socialMedia.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">
                    Add your YouTube, Instagram, or other social profiles to build trust with students.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {formData.socialMedia.map((account, index) => (
                      <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                        <div className="w-full sm:w-1/3">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Platform</label>
                          <select
                            value={account.platform}
                            onChange={(e) => handleSocialMediaChange(index, "platform", e.target.value)}
                            className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                          >
                            <option value="youtube">YouTube</option>
                            <option value="instagram">Instagram</option>
                            <option value="facebook">Facebook</option>
                            <option value="twitter">Twitter / X</option>
                            <option value="linkedin">LinkedIn</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div className="w-full sm:w-1/3">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Profile URL</label>
                          <input
                            type="url"
                            value={account.url}
                            onChange={(e) => handleSocialMediaChange(index, "url", e.target.value)}
                            placeholder="https://..."
                            className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                            required
                          />
                        </div>
                        <div className="w-full sm:w-1/3">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">Followers</label>
                          <div className="flex items-center gap-2">
                            <select
                              value={account.followerBracket}
                              onChange={(e) => handleSocialMediaChange(index, "followerBracket", e.target.value)}
                              className="w-full border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                            >
                              <option value="0 - 1K">0 - 1K</option>
                              <option value="1K - 5K">1K - 5K</option>
                              <option value="5K - 20K">5K - 20K</option>
                              <option value="20K - 50K">20K - 50K</option>
                              <option value="50K - 1L">50K - 1L</option>
                              <option value="1L - 5L">1L - 5L</option>
                              <option value="5L+">5L+</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleSocialMediaRemove(index)}
                              className="p-2 text-slate-400 hover:text-danger hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors shrink-0"
                              title="Remove account"
                            >
                              <Trash weight="bold" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || uploadingDoc}
            className="w-full max-w-2xl mx-auto block bg-brand-main dark:bg-brand-500 text-brand-950 dark:text-slate-950 py-4 rounded-2xl font-extrabold text-base shadow-xl hover:opacity-95 mt-4 disabled:opacity-50 transition-all active:scale-[0.99]"
          >
            {loading
              ? "Submitting Application..."
              : isReapplying
                ? "Update & Re-submit Application"
                : "Submit Application"}
          </button>
        </form>
      </div>

      {/* Success Modal Overlay */}
      {success && (
        <div className="fixed inset-0 bg-slate-900/70 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-sm border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center text-4xl mb-5 border border-success/20">
              <CheckCircle weight="fill" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
              {isReapplying ? "Application Updated!" : "Application Submitted!"}
            </h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Our admin team is reviewing your profile. You will be redirected
              to the dashboard shortly.
            </p>
            <div className="w-8 h-8 border-4 border-success border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}
    </div>
  );
}
