import Link from "next/link";
import { Heart } from "@phosphor-icons/react/dist/ssr";

export function PublicFooter() {
  return (
    <footer className="w-full bg-slate-950 text-slate-400 py-16 px-6 sm:px-8 lg:px-12 relative overflow-hidden border-t border-slate-900 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col gap-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Brand Col */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <Link href="/" className="flex items-center gap-3 group">
              <img src="/logo.png" alt="Help Sathi Logo" className="h-10 w-auto object-contain brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity" />
              <span className="font-extrabold text-2xl text-white tracking-tight">
                Help<span className="text-blue-500">Sathi</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              India&apos;s leading mentorship platform connecting ambitious students with verified top rankers, industry experts, and experienced mentors for 1-on-1 guidance and pay-per-minute consultations.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> 100% Verified Mentors
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                🔒 Secure Razorpay Payments
              </span>
            </div>
          </div>

          {/* Links Cols */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="text-white font-bold mb-4 text-xs tracking-wider uppercase">Platform</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/mentors" className="hover:text-blue-400 transition-colors">Browse Mentors</Link></li>
                <li><Link href="/categories" className="hover:text-blue-400 transition-colors">Categories</Link></li>
                <li><Link href="/pricing" className="hover:text-blue-400 transition-colors">Pricing & Plans</Link></li>
                <li><Link href="/community" className="hover:text-blue-400 transition-colors">Community Forum</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-xs tracking-wider uppercase">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/about" className="hover:text-blue-400 transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-blue-400 transition-colors">Contact Support</Link></li>
                <li><Link href="/login" className="hover:text-blue-400 transition-colors">Become a Mentor</Link></li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <h4 className="text-white font-bold mb-4 text-xs tracking-wider uppercase">Legal & Trust</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/refund" className="hover:text-blue-400 transition-colors">Refund Policy</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} Help Sathi. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <span>Built with</span>
            <Heart weight="fill" className="text-rose-500 animate-pulse text-sm" />
            <span>for students across India</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
