import Link from "next/link";
import { Heart, InstagramLogo, YoutubeLogo, TelegramLogo, WhatsappLogo, FacebookLogo } from "@phosphor-icons/react/dist/ssr";

export function PublicFooter() {
  return (
    <footer className="w-full bg-slate-950 text-slate-400 py-16 px-6 sm:px-8 lg:px-12 relative overflow-hidden border-t border-slate-900 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col gap-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Brand Col */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <Link href="/" className="flex items-center group">
              <span className="font-extrabold text-2xl text-white tracking-tight">
                Help<span className="text-blue-500">Sathi</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              India&apos;s leading mentorship platform connecting ambitious students with verified top rankers, industry experts, and experienced mentors for 1-on-1 guidance and pay-per-minute consultations.
            </p>
            <div className="flex gap-4 mt-2">
              <a href="https://whatsapp.com/channel/0029VbDpXDkAjPXHpnAOrW1k" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-green-500 hover:bg-slate-800 hover:border-green-500/50 transition-all">
                <WhatsappLogo weight="fill" className="text-lg" />
              </a>
              <a href="https://t.me/helpsathi" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:bg-slate-800 hover:border-blue-400/50 transition-all">
                <TelegramLogo weight="fill" className="text-lg" />
              </a>
              <a href="https://www.instagram.com/helpsathii" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-pink-500 hover:bg-slate-800 hover:border-pink-500/50 transition-all">
                <InstagramLogo weight="fill" className="text-lg" />
              </a>
              <a href="https://www.youtube.com/@helpsathii" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-slate-800 hover:border-red-500/50 transition-all">
                <YoutubeLogo weight="fill" className="text-lg" />
              </a>
              <a href="https://www.facebook.com/share/1DTY7cFLYJ/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-slate-800 hover:border-blue-500/50 transition-all">
                <FacebookLogo weight="fill" className="text-lg" />
              </a>
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
                <li><Link href="/refund" className="hover:text-blue-400 transition-colors">Cancellation & Refund</Link></li>
                <li><Link href="/shipping" className="hover:text-blue-400 transition-colors">Shipping & Exchange</Link></li>
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
