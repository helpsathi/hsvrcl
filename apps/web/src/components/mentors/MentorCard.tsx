import Image from "next/image";
import Link from "next/link";
import { StarRating } from "@/components/ui/star-rating";
import { SealCheck, Crown, ChatCircleDots, PhoneCall, CalendarPlus, UserCheck } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";

export interface MentorProps {
  id: string;
  profileId?: string; // MentorProfile.id for profile page navigation
  name: string;
  avatar: string;
  verified: boolean;
  tagline: string;
  languages: string[];
  experience: number;
  rating: number;
  reviews: number;
  isOnline: boolean;
  pricePerMinute: number;
  callPricePerMinute?: number;
  monthlyPrice?: number;
  mustTry?: boolean;
  subscription?: any;
}

export interface MentorCardProps {
  mentor: MentorProps;
  onChat?: (mentorId: string) => void;
  onCall?: (mentorId: string) => void;
  onBook?: (mentorId: string) => void;
  onSubscribe?: (mentor: MentorProps) => void;
  isSelf?: boolean;
  isSubscribed?: boolean;
}

export function MentorCard({ mentor, onChat, onCall, onBook, onSubscribe, isSelf: explicitIsSelf, isSubscribed }: MentorCardProps) {
  const { user: currentUser } = useAuth();
  const isSelf = explicitIsSelf ?? (currentUser?.id ? currentUser.id === mentor.id : false);
  const profileUrl = `/mentors/${mentor.profileId || mentor.id}`;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-card border border-slate-100 dark:border-slate-800/80 flex flex-col relative overflow-hidden hover:shadow-lg dark:hover:shadow-slate-800/50 transition-all">
      {mentor.mustTry && (
        <div className="absolute top-0 left-0 bg-brand-500 dark:bg-brand-600 text-white text-[10px] font-bold px-3 py-1 rounded-br-xl z-10 shadow-sm tracking-wide">
          MUST TRY
        </div>
      )}

      <div className="flex gap-4">
        <Link href={profileUrl} className="flex flex-col items-center shrink-0 w-20 pt-4 hover:opacity-90 transition-opacity group">
          <div className="relative mb-2">
            <img 
              src={mentor.avatar || "/mentor-placeholder.png"} 
              alt={mentor.name}
              referrerPolicy="no-referrer"
              onError={(e) => { (e.target as HTMLImageElement).src = "/mentor-placeholder.png"; }}
              className={cn("w-16 h-16 rounded-full border-2 border-slate-200 dark:border-slate-700 object-cover group-hover:border-brand-500 transition-colors", !mentor.isOnline && "grayscale")} 
            />
            <div className={cn(
              "absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900",
              mentor.isOnline ? "bg-success animate-pulse-green" : "bg-slate-400 dark:bg-slate-600"
            )}></div>
          </div>
          {mentor.rating > 0 ? (
            <>
              <StarRating rating={mentor.rating} className="text-[11px]" starClassName="text-[11px]" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {mentor.rating.toFixed(1)} ({mentor.reviews > 1000 ? `${(mentor.reviews / 1000).toFixed(1)}k+` : mentor.reviews})
              </span>
            </>
          ) : (
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-full mt-0.5">
              ★ New
            </span>
          )}
        </Link>

        <div className="flex-1 flex flex-col min-w-0 pt-3">
          <div className="flex items-center justify-between mb-1">
            <Link href={profileUrl} className="flex items-center gap-1 hover:underline min-w-0">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 truncate">{mentor.name}</h3>
              {mentor.verified && <SealCheck weight="fill" className="text-brand-500 dark:text-brand-400 text-sm shrink-0" />}
              {isSelf && (
                <span className="ml-1 text-[10px] font-extrabold bg-brand-100 dark:bg-brand-900/70 text-brand-800 dark:text-brand-300 px-1.5 py-0.5 rounded border border-brand-200 dark:border-brand-700/60 shrink-0">
                  You
                </span>
              )}
            </Link>
            {!mentor.isOnline && <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-bold shrink-0">OFFLINE</span>}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 truncate mb-1">{mentor.tagline}</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">{mentor.languages.join(", ")} • Exp: {mentor.experience} Yrs</p>
          
          {mentor.monthlyPrice && (
            isSelf ? (
              <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5 w-max mb-3 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                <Crown weight="fill" className="text-amber-500 text-sm shrink-0" />
                <span>Your Plan: ₹{mentor.monthlyPrice}/mo</span>
              </div>
            ) : isSubscribed ? (
              <div className="bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-700/80 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5 w-max mb-3 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                <Crown weight="fill" className="text-emerald-500 text-sm shrink-0" />
                <span>Subscribed</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onSubscribe) {
                    onSubscribe(mentor);
                  } else {
                    window.location.href = profileUrl;
                  }
                }}
                className="bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-700/80 rounded-lg px-2.5 py-1.5 inline-flex items-center gap-1.5 w-max mb-3 shadow-2xs hover:shadow-sm transition-all transform active:scale-95 group"
              >
                <Crown weight="fill" className="text-amber-500 group-hover:scale-110 transition-transform text-sm shrink-0" />
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-200 tracking-tight">Subscribe: ₹{mentor.monthlyPrice}/mo</span>
              </button>
            )
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/80">
        {isSelf ? (
          <Link 
            href="/mentor-dashboard"
            className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-brand-500 dark:hover:bg-brand-400 text-white dark:text-slate-950 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <UserCheck weight="bold" className="text-base" /> Manage Mentor Dashboard
          </Link>
        ) : mentor.isOnline ? (
          <>
            <button 
              onClick={() => onChat?.(mentor.id)}
              className="flex-1 bg-brand-main dark:bg-brand-500 border border-brand-500 dark:border-brand-600 text-brand-900 dark:text-slate-950 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-brand-400 dark:hover:bg-brand-400 transition-colors"
            >
              <ChatCircleDots weight="fill" className="text-base" /> Chat <span className="font-normal opacity-80">(₹{mentor.pricePerMinute}/m)</span>
            </button>
            <button 
              onClick={() => onCall?.(mentor.id)}
              className="flex-1 bg-white dark:bg-slate-800 border border-success dark:border-emerald-500/80 text-success dark:text-emerald-400 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-success hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white transition-colors"
            >
              <PhoneCall weight="fill" className="text-base" /> Call <span className="font-normal opacity-80">(₹{mentor.callPricePerMinute ?? mentor.pricePerMinute}/m)</span>
            </button>
          </>
        ) : (
          <button 
            onClick={() => onBook?.(mentor.id)}
            className="w-full bg-slate-900 dark:bg-brand-600 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:bg-slate-800 dark:hover:bg-brand-500 transition-colors"
          >
            <CalendarPlus weight="fill" className="text-lg" /> Book Appointment
          </button>
        )}
      </div>
    </div>
  );
}
