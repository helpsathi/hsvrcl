"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { User, Camera, WarningCircle, CheckCircle, Sparkle, ArrowRight, UploadSimple } from "@phosphor-icons/react";
import { validatePhoneNumber } from "@/lib/phoneValidation";

const AVATAR_PRESETS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=Helpsathi1",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Helpsathi2",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Helpsathi3",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Helpsathi4",
  "https://api.dicebear.com/7.x/shapes/svg?seed=Helpsathi5",
  "https://api.dicebear.com/7.x/icons/svg?seed=Helpsathi6",
];

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    avatar: "",
  });
  
  const [initialized, setInitialized] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && !initialized) {
      if (user.profileComplete) {
        if (user.role === "ADMIN" || user.adminSubRole) router.push("/admin");
        else if (user.role === "MENTOR" && user.mentorStatus === "APPROVED") router.push("/mentor-dashboard");
        else router.push("/dashboard");
      } else {
        const fallbackInitial = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=0D8ABC&color=fff`;
        setFormData({
          name: user.name || "",
          phone: (user as any).phone || "",
          avatar: user.avatar || fallbackInitial,
        });
        setInitialized(true);
      }
    }
  }, [user, initialized, router]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    setUploadingImage(true);
    setError("");

    try {
      const formUpload = new FormData();
      formUpload.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formUpload,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image.");
      }

      setFormData(prev => ({ ...prev, avatar: data.url }));
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload custom photo. Please check file size and try again.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneCheck = validatePhoneNumber(formData.phone);
    if (!phoneCheck.isValid) {
      setError(phoneCheck.error || "Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/profile/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          phone: phoneCheck.cleanPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save profile");

      const updatedRole = data.user?.role || user?.role;
      if (updatedRole === "ADMIN" || user?.adminSubRole) {
        window.location.href = "/admin";
      } else if (updatedRole === "MENTOR") {
        window.location.href = "/mentor-dashboard";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Setting up workspace...</p>
        </div>
      </div>
    );
  }

  const isPhoneValid = formData.phone.length === 10;
  const isFormValid = formData.name.trim().length > 0 && isPhoneValid;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden font-sans transition-colors">
      {/* Dynamic Background Mesh */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 dark:bg-amber-500/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-lg w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl relative z-10 transition-colors">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3 transition-colors">
            <Sparkle weight="fill" className="text-amber-500 dark:text-amber-400 text-sm" /> Step 1 of 1
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2 transition-colors">Complete Your Profile</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm transition-colors">Fill in your details below to activate your HelpSathi account.</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-3.5 rounded-2xl text-sm mb-6 font-medium flex items-center gap-2.5 animate-fadeIn transition-colors">
            <WarningCircle weight="bold" className="text-lg shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Avatar Upload Container */}
          <div className="flex flex-col items-center">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-amber-500 via-indigo-500 to-blue-500 shadow-lg shadow-amber-500/10 overflow-hidden">
                <img 
                  src={formData.avatar || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || user.name || "User")}&background=0D8ABC&color=fff`} 
                  alt="Profile" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || user.name || "User")}&background=0D8ABC&color=fff`;
                  }}
                  className="w-full h-full rounded-full object-cover bg-slate-100 dark:bg-slate-800 transition-colors"
                />
              </div>
              <div className="absolute inset-1 bg-slate-900/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera weight="fill" className="text-white text-2xl mb-0.5" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">Change</span>
              </div>
              {uploadingImage && (
                <div className="absolute inset-1 bg-slate-900/80 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Direct Server Upload Trigger & Google Photo Restore */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3.5 py-1.5 rounded-full hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <UploadSimple weight="bold" /> {uploadingImage ? "Uploading..." : "Upload Custom Photo"}
              </button>

              {user.avatar && formData.avatar !== user.avatar && (
                <button 
                  type="button" 
                  onClick={() => setFormData(prev => ({ ...prev, avatar: user.avatar! }))}
                  className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-3.5 py-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors flex items-center gap-1.5"
                >
                  <Sparkle weight="fill" className="text-amber-500" /> Use Google Photo
                </button>
              )}
            </div>

            {/* Quick Avatar Presets */}
            <div className="mt-4 w-full">
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-2 font-medium transition-colors">Or pick an avatar preset:</p>
              <div className="flex items-center justify-center gap-2">
                {AVATAR_PRESETS.map((presetUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, avatar: presetUrl }))}
                    className={`w-9 h-9 rounded-full p-0.5 border-2 transition-all overflow-hidden ${
                      formData.avatar === presetUrl 
                        ? "border-amber-500 dark:border-amber-400 scale-110 shadow-md shadow-amber-500/30" 
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={presetUrl} alt={`Preset ${idx}`} className="w-full h-full rounded-full object-cover bg-slate-100 dark:bg-slate-800" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5 pt-2">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider transition-colors">Full Name</label>
              <input 
                type="text" 
                required
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl p-3.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-medium" 
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider transition-colors">Email Address</label>
              <input 
                type="email" 
                value={user.email}
                disabled
                className="w-full bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 rounded-xl p-3.5 text-sm cursor-not-allowed font-medium transition-colors" 
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-1 transition-colors">Associated with your account login.</p>
            </div>

            {/* Phone Number */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider transition-colors">
                  Phone Number <span className="text-amber-500 dark:text-amber-400">*</span>
                </label>
                {isPhoneValid && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 transition-colors">
                    <CheckCircle weight="fill" /> Valid 10 digits
                  </span>
                )}
              </div>

              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-sm font-bold text-slate-500 dark:text-slate-400 pointer-events-none transition-colors">+91</span>
                <input 
                  type="tel" 
                  required
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData(prev => ({ ...prev, phone: val }));
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 rounded-xl p-3.5 pl-12 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-medium tracking-wider" 
                />
                <span className="absolute right-3.5 text-xs font-semibold text-slate-400 dark:text-slate-500 pointer-events-none transition-colors">
                  {formData.phone.length}/10
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isSubmitting || uploadingImage || !isFormValid}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-50 dark:text-slate-950 py-4 rounded-xl font-bold shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base mt-4"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-50 dark:border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <span>Complete Profile & Continue</span>
                <ArrowRight weight="bold" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
