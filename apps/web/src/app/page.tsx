import Link from "next/link";
import { MagnifyingGlass, ChatCircleDots, SealCheck, BookOpenText, Atom, Code, Buildings, Briefcase, RocketLaunch, Gift, Wallet, CalendarCheck } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { TextAnimate } from "@/components/magicui/text-animate";
import { ScrollBasedVelocity } from "@/components/magicui/scroll-based-velocity";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { PublicNav } from "@/components/layout/PublicNav";
import { InstallAppButton } from "@/components/pwa/InstallAppButton";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "HelpSathi | Learn from the Best Mentors Online",
  description: "Connect with verified mentors for UPSC, JEE, NEET, and Software Engineering. Get 1-on-1 guidance and live chat.",
  openGraph: {
    title: "HelpSathi | Learn from the Best Mentors Online",
    description: "Connect with verified mentors for UPSC, JEE, NEET, and Software Engineering.",
    url: "https://helpsathi.com",
  }
};

export default function LandingPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "HelpSathi",
    "url": "https://helpsathi.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://helpsathi.com/mentors?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    <div className="flex-col w-full min-h-screen overflow-y-auto no-scrollbar bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors">
      {/* Public Navigation */}
      <PublicNav />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-slate-50 dark:bg-slate-950">
        <section className="relative min-h-[90vh] flex items-center bg-[radial-gradient(circle_at_top_right,#e5eeff_0%,transparent_70%)] dark:bg-[radial-gradient(circle_at_top_right,#1e293b_0%,transparent_70%)]">
          <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-4 lg:gap-12 items-center py-8 lg:py-20 w-full">
            {/* Content Column */}
            <div className="flex flex-col justify-center gap-8 z-10 min-h-[90vh] lg:min-h-0">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 rounded-full w-fit">
                <span className="text-blue-600 dark:text-blue-400 text-lg">✓</span>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Connect with Top 1% Mentors</span>
              </div>

              <h1 className="text-5xl lg:text-[64px] font-extrabold text-slate-900 dark:text-white leading-[1.1] tracking-tight">
                Find Your Perfect <br /> <span className="text-blue-600 dark:text-blue-500 italic">Mentor</span>
              </h1>

              <div className="text-lg text-slate-600 dark:text-slate-400 max-w-[540px] leading-relaxed">
                <TextAnimate 
                  text="Connect with verified mentors and rankers from India's top competitive exams. Receive personalized guidance, proven strategies, and expert support throughout your preparation." 
                  by="character"
                />
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap gap-3.5 mt-2">
                <Link href="/login" className="bg-blue-600 text-white font-semibold px-8 py-4 rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group">
                  Find Your Mentor
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
                <InstallAppButton variant="hero" />
              </div>
            </div>

            {/* Interactive Circuit Board Journey */}
            <div className="hidden md:flex landscape:flex relative items-center justify-center w-full h-[400px] lg:h-[550px] perspective-[1000px] mb-8 lg:mb-0 animate-[slideUpFade_1s_ease-out_0.2s_both]">
              
              {/* Background Ambient Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] lg:w-[400px] h-[300px] lg:h-[400px] bg-gradient-to-tr from-blue-600/10 via-indigo-500/10 to-emerald-500/10 rounded-full blur-[60px] lg:blur-[80px] pointer-events-none"></div>

              <div className="relative w-full max-w-sm transform lg:rotate-y-[-8deg] lg:rotate-x-[4deg] lg:hover:rotate-y-0 lg:hover:rotate-x-0 transition-transform duration-700 ease-out preserve-3d scale-[0.85] sm:scale-100">
                
                {/* Main Vertical Circuit Trunk */}
                <div className="absolute left-6 top-8 bottom-8 w-[2px] bg-slate-200/80 dark:bg-slate-700/50 rounded-full overflow-hidden shadow-inner z-0">
                   <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-transparent via-blue-500 to-transparent h-[40%] animate-[slideDown_3s_linear_infinite]"></div>
                </div>

                <div className="space-y-6 relative z-10 py-4">
                  
                  {/* Step 1: Confused */}
                  <div className="relative flex items-center group pl-16 transform lg:hover:-translate-y-1 transition-transform duration-300 animate-[slideUpFade_0.8s_ease-out_0.4s_both]">
                    {/* Circuit Branch */}
                    <div className="absolute left-[25px] top-1/2 -translate-y-1/2 w-[39px] h-[2px] bg-slate-200/80 dark:bg-slate-700/50 overflow-hidden">
                      <div className="w-full h-full bg-blue-500 -translate-x-full lg:group-hover:translate-x-0 transition-transform duration-500 ease-out"></div>
                    </div>
                    {/* Node Dot */}
                    <div className="absolute left-[19px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 lg:group-hover:border-blue-500 lg:group-hover:bg-blue-100 dark:lg:group-hover:bg-blue-900 transition-all duration-300 z-10 shadow-sm"></div>

                    {/* Card */}
                    <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/50 backdrop-blur-md border border-white/80 dark:border-slate-700/50 shadow-lg shadow-slate-200/20 dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] lg:group-hover:bg-white/90 dark:lg:group-hover:bg-slate-800/80 transition-colors duration-300 w-full">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-600/50 shadow-sm lg:group-hover:scale-110 transition-transform duration-300">
                         <svg className="w-5 h-5 text-slate-500 dark:text-slate-400 lg:group-hover:text-blue-600 dark:lg:group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Feeling Lost?</div>
                        <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Overwhelmed by preparation.</div>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Match */}
                  <div className="relative flex items-center group pl-24 transform lg:hover:-translate-y-1 transition-transform duration-300 animate-[slideUpFade_0.8s_ease-out_0.6s_both]">
                    <div className="absolute left-[25px] top-1/2 -translate-y-1/2 w-[71px] h-[2px] bg-slate-200/80 dark:bg-slate-700/50 overflow-hidden">
                      <div className="w-full h-full bg-blue-500 -translate-x-full lg:group-hover:translate-x-0 transition-transform duration-500 ease-out delay-75"></div>
                    </div>
                    <div className="absolute left-[19px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 lg:group-hover:border-blue-500 lg:group-hover:bg-blue-100 dark:lg:group-hover:bg-blue-900 transition-all duration-300 z-10 shadow-sm"></div>

                    <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/50 backdrop-blur-md border border-white/80 dark:border-slate-700/50 shadow-lg shadow-blue-500/5 dark:shadow-[0_10px_30px_-10px_rgba(37,99,235,0.2)] lg:group-hover:bg-white/90 dark:lg:group-hover:bg-slate-800/80 transition-colors duration-300 w-full relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -mr-16 -mt-16 lg:group-hover:bg-blue-500/20 transition-colors"></div>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50 flex items-center justify-center shrink-0 border border-blue-200/50 dark:border-blue-700/50 shadow-sm lg:group-hover:scale-110 transition-transform duration-300 relative z-10">
                         <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                      </div>
                      <div className="relative z-10">
                        <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">HelpSathi Match</div>
                        <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">Connected with a Top Mentor.</div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Strategy */}
                  <div className="relative flex items-center group pl-20 transform lg:hover:-translate-y-1 transition-transform duration-300 animate-[slideUpFade_0.8s_ease-out_0.8s_both]">
                    <div className="absolute left-[25px] top-1/2 -translate-y-1/2 w-[55px] h-[2px] bg-slate-200/80 dark:bg-slate-700/50 overflow-hidden">
                      <div className="w-full h-full bg-indigo-500 -translate-x-full lg:group-hover:translate-x-0 transition-transform duration-500 ease-out delay-75"></div>
                    </div>
                    <div className="absolute left-[19px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 lg:group-hover:border-indigo-500 lg:group-hover:bg-indigo-100 dark:lg:group-hover:bg-indigo-900 transition-all duration-300 z-10 shadow-sm"></div>

                    <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/60 dark:bg-slate-900/50 backdrop-blur-md border border-white/80 dark:border-slate-700/50 shadow-lg shadow-indigo-500/5 dark:shadow-[0_10px_30px_-10px_rgba(79,70,229,0.2)] lg:group-hover:bg-white/90 dark:lg:group-hover:bg-slate-800/80 transition-colors duration-300 w-full relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16 lg:group-hover:bg-indigo-500/20 transition-colors"></div>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/50 dark:to-indigo-800/50 flex items-center justify-center shrink-0 border border-indigo-200/50 dark:border-indigo-700/50 shadow-sm lg:group-hover:scale-110 transition-transform duration-300 relative z-10">
                         <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                      </div>
                      <div className="relative z-10">
                        <div className="text-[13px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Clear Strategy</div>
                        <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">1-on-1 personalized roadmap.</div>
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Goal Achieved */}
                  <div className="relative flex items-center group pl-12 transform lg:hover:-translate-y-1 transition-transform duration-300 animate-[slideUpFade_0.8s_ease-out_1s_both]">
                    <div className="absolute left-[25px] top-1/2 -translate-y-1/2 w-[23px] h-[2px] bg-slate-200/80 dark:bg-slate-700/50 overflow-hidden">
                      <div className="w-full h-full bg-emerald-500 -translate-x-full lg:group-hover:translate-x-0 transition-transform duration-500 ease-out delay-75"></div>
                    </div>
                    <div className="absolute left-[18px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-[3px] border-emerald-400 dark:border-emerald-500 lg:group-hover:scale-125 lg:group-hover:shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all duration-300 z-10"></div>

                    <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 backdrop-blur-md border border-emerald-200/60 dark:border-emerald-700/50 shadow-xl shadow-emerald-500/10 dark:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.3)] transition-all duration-300 w-full relative overflow-hidden lg:group-hover:shadow-2xl lg:group-hover:shadow-emerald-500/20">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-white/10 -translate-x-full lg:group-hover:animate-[shimmer_1.5s_infinite]"></div>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-16 -mt-16 lg:group-hover:bg-emerald-500/30 transition-colors"></div>
                      
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/60 dark:to-emerald-800/60 flex items-center justify-center shrink-0 border border-emerald-300/50 dark:border-emerald-700/50 shadow-sm lg:group-hover:scale-110 lg:group-hover:rotate-6 transition-transform duration-300 relative z-10">
                         <div className="absolute inset-0 bg-emerald-500 rounded-xl animate-ping opacity-20 lg:group-hover:opacity-40 transition-opacity"></div>
                         <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                      </div>
                      <div className="relative z-10">
                        <div className="text-[13px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Goal Achieved</div>
                        <div className="text-[12px] font-medium text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">Exam cleared successfully!</div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Categories Section */}
        <div className="relative py-24 bg-slate-50/50 dark:bg-slate-950 overflow-hidden">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 text-center md:text-left">
              <div className="max-w-2xl mx-auto md:mx-0">
                <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">Explore Categories</h2>
                <p className="text-lg text-slate-600 dark:text-slate-400">Find the perfect mentor tailored to your specific goals and career aspirations.</p>
              </div>
              <Link href="/categories" className="inline-flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:gap-3 transition-all shrink-0">
                View all categories <span>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Card 1 */}
              <Link href="/login" className="group relative bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 flex items-center gap-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-16 h-16 shrink-0 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm relative z-10 border border-indigo-100 dark:border-indigo-500/20">
                  <BookOpenText weight="duotone" />
                </div>
                <div className="relative z-10 text-left">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">UPSC / BPSC</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Civil Services & State Exams</p>
                </div>
              </Link>

              {/* Card 2 */}
              <Link href="/login" className="group relative bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 hover:border-teal-500/50 dark:hover:border-teal-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/10 flex items-center gap-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-teal-500/0 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-16 h-16 shrink-0 bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-sm relative z-10 border border-teal-100 dark:border-teal-500/20">
                  <Atom weight="duotone" />
                </div>
                <div className="relative z-10 text-left">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">JEE / NEET</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Engineering & Medical Entrance</p>
                </div>
              </Link>

              {/* Card 3 */}
              <Link href="/login" className="group relative bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 flex items-center gap-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-16 h-16 shrink-0 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm relative z-10 border border-blue-100 dark:border-blue-500/20">
                  <Code weight="duotone" />
                </div>
                <div className="relative z-10 text-left">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">Software Engg</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">SDE, Web Dev & System Design</p>
                </div>
              </Link>

              {/* Card 4 */}
              <Link href="/login" className="group relative bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 hover:border-rose-500/50 dark:hover:border-rose-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-500/10 flex items-center gap-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/0 via-rose-500/0 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-16 h-16 shrink-0 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-sm relative z-10 border border-rose-100 dark:border-rose-500/20">
                  <Buildings weight="duotone" />
                </div>
                <div className="relative z-10 text-left">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">Govt Exams</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">SSC, Banking & Railways</p>
                </div>
              </Link>

              {/* Card 5 */}
              <Link href="/login" className="group relative bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 hover:border-purple-500/50 dark:hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 flex items-center gap-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/0 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-16 h-16 shrink-0 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-sm relative z-10 border border-purple-100 dark:border-purple-500/20">
                  <Briefcase weight="duotone" />
                </div>
                <div className="relative z-10 text-left">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">Placement Prep</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Aptitude, Core & Interviews</p>
                </div>
              </Link>

              {/* Card 6 */}
              <Link href="/login" className="group relative bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-500/10 flex items-center gap-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/0 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-16 h-16 shrink-0 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-sm relative z-10 border border-amber-100 dark:border-amber-500/20">
                  <RocketLaunch weight="duotone" />
                </div>
                <div className="relative z-10 text-left">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">Startup / Biz</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Founders, VCs & Product</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Velocity Marquee */}
        <div className="w-full bg-slate-50 dark:bg-slate-900/20 py-6 md:py-12 overflow-hidden flex flex-col gap-2 md:gap-3 items-center justify-center border-y border-slate-200/50 dark:border-slate-800/50 relative">
          <ScrollBasedVelocity text="TRUSTED BY AMBITIOUS STUDENTS & MENTORS" defaultVelocity={-1} className="text-2xl sm:text-3xl md:text-7xl font-black text-slate-800 dark:text-slate-200 uppercase tracking-tighter" />
          <ScrollBasedVelocity text="EXPERT GUIDANCE • PERSONALIZED ROADMAPS" defaultVelocity={1} className="text-2xl sm:text-3xl md:text-7xl font-black text-transparent [-webkit-text-stroke:1px_#1e293b] dark:[-webkit-text-stroke:1px_#e2e8f0] uppercase tracking-tighter" />
        </div>

        {/* How it works Section */}
        <div className="py-24 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
          {/* Decorative background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">How Help Sathi Works</h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">Flexible payment options. Personalized guidance. <br className="hidden sm:block" /> Start your mentorship journey in three simple steps.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 relative max-w-6xl mx-auto">
               
               {/* Animated Connecting Line (Desktop only) */}
               <div className="hidden lg:block absolute top-1/2 left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent -translate-y-1/2 z-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent w-1/2 animate-[shimmer_3s_infinite]"></div>
               </div>

               {/* Step 1 */}
               <div className="relative z-10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border border-white dark:border-slate-800 p-8 sm:p-10 rounded-[2rem] shadow-xl shadow-slate-200/40 dark:shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5)] transform hover:-translate-y-2 transition-all duration-500 group flex flex-col justify-center h-full">
                 <div className="absolute top-6 right-8 text-[100px] font-black text-slate-100 dark:text-slate-800/40 leading-none -z-10 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 select-none">1</div>
                 
                 <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center text-3xl mb-8 border border-white dark:border-blue-700/50 shadow-md group-hover:scale-110 transition-transform duration-500">
                    <MagnifyingGlass weight="duotone" />
                 </div>
                 <h3 className="font-bold text-2xl text-slate-900 dark:text-white mb-4">Find a Mentor</h3>
                 <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Browse thousands of verified experts based on your exams, goals, or career path.</p>
               </div>

               {/* Step 2 (Branching Options) */}
               <div className="relative z-10 flex flex-col gap-6 justify-center">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center text-xs font-black text-slate-400 dark:text-slate-500 z-20 border-4 border-slate-50 dark:border-slate-950 shadow-sm shadow-slate-200/50 dark:shadow-none">OR</div>
                 
                 {/* Option A */}
                 <div className="flex-1 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border border-white dark:border-slate-800 p-6 rounded-[2rem] shadow-lg shadow-slate-200/40 dark:shadow-none transform hover:-translate-y-1 hover:border-amber-200 dark:hover:border-amber-700/50 transition-all duration-300 group">
                   <div className="flex items-start gap-5">
                     <div className="w-14 h-14 shrink-0 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/40 dark:to-amber-800/40 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center text-2xl border border-white dark:border-amber-700/50 shadow-sm group-hover:scale-110 transition-transform duration-500">
                       <Wallet weight="duotone" />
                     </div>
                     <div className="mt-1">
                       <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Option 2a</div>
                       <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1.5 leading-tight">Pay Per Minute</h3>
                       <p className="text-sm text-slate-600 dark:text-slate-400">Recharge wallet. Ideal for quick doubts.</p>
                     </div>
                   </div>
                 </div>

                 {/* Option B */}
                 <div className="flex-1 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border border-white dark:border-slate-800 p-6 rounded-[2rem] shadow-lg shadow-slate-200/40 dark:shadow-none transform hover:-translate-y-1 hover:border-emerald-200 dark:hover:border-emerald-700/50 transition-all duration-300 group">
                   <div className="flex items-start gap-5">
                     <div className="w-14 h-14 shrink-0 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/40 dark:to-emerald-800/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center text-2xl border border-white dark:border-emerald-700/50 shadow-sm group-hover:scale-110 transition-transform duration-500">
                       <CalendarCheck weight="duotone" />
                     </div>
                     <div className="mt-1">
                       <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Option 2b</div>
                       <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1.5 leading-tight">Monthly Plan</h3>
                       <p className="text-sm text-slate-600 dark:text-slate-400">Subscribe for unlimited text support.</p>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Step 3 */}
               <div className="relative z-10 bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl border border-white dark:border-slate-800 p-8 sm:p-10 rounded-[2rem] shadow-xl shadow-slate-200/40 dark:shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5)] transform hover:-translate-y-2 transition-all duration-500 group flex flex-col justify-center h-full">
                 <div className="absolute top-6 right-8 text-[100px] font-black text-slate-100 dark:text-slate-800/40 leading-none -z-10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 select-none">3</div>
                 <div className="w-16 h-16 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/40 dark:to-purple-800/40 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center text-3xl mb-8 border border-white dark:border-purple-700/50 shadow-md group-hover:scale-110 transition-transform duration-500">
                    <ChatCircleDots weight="duotone" />
                 </div>
                 <h3 className="font-bold text-2xl text-slate-900 dark:text-white mb-4">Connect & Learn</h3>
                 <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Connect instantly via chat or call to clear doubts, build strategies, and succeed.</p>
               </div>
            </div>
          </div>
        </div>

        {/* Premium Footer */}
        <footer className="relative bg-slate-950 text-slate-400 pt-20 pb-8 overflow-hidden border-t border-slate-900">
          {/* Top subtle gradient line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
          
          {/* Ambient background glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
              
              {/* Brand Column */}
              <div className="lg:col-span-5">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-white font-extrabold text-3xl tracking-tight">Help Sathi</span>
                </div>
                <p className="text-slate-500 mb-8 max-w-sm leading-relaxed">
                  Empowering millions of students through personalized 1-on-1 mentorship with verified rankers and industry experts.
                </p>
                <div className="flex gap-4">
                  {/* Social Icons removed as requested */}
                </div>
              </div>

              {/* Links Columns */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-8">
                <div>
                  <h4 className="text-white font-bold mb-6 text-sm tracking-widest uppercase">Platform</h4>
                  <ul className="space-y-4">
                    <li><Link href="/mentors" className="hover:text-blue-400 hover:translate-x-1 inline-block transition-transform duration-300">Browse Mentors</Link></li>
                    <li><Link href="/pricing" className="hover:text-blue-400 hover:translate-x-1 inline-block transition-transform duration-300">Pricing</Link></li>
                    <li><Link href="/community" className="hover:text-blue-400 hover:translate-x-1 inline-block transition-transform duration-300">Community</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-6 text-sm tracking-widest uppercase">Company</h4>
                  <ul className="space-y-4">
                    <li><Link href="/about" className="hover:text-blue-400 hover:translate-x-1 inline-block transition-transform duration-300">About Us</Link></li>
                    <li><Link href="/contact" className="hover:text-blue-400 hover:translate-x-1 inline-block transition-transform duration-300">Contact</Link></li>
                    <li><Link href="/login" className="hover:text-blue-400 hover:translate-x-1 inline-block transition-transform duration-300">Become a Mentor</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-bold mb-6 text-sm tracking-widest uppercase">Legal</h4>
                  <ul className="space-y-4">
                    <li><Link href="/terms" className="hover:text-blue-400 hover:translate-x-1 inline-block transition-transform duration-300">Terms of Service</Link></li>
                    <li><Link href="/privacy" className="hover:text-blue-400 hover:translate-x-1 inline-block transition-transform duration-300">Privacy Policy</Link></li>
                    <li><Link href="/refund" className="hover:text-blue-400 hover:translate-x-1 inline-block transition-transform duration-300">Refund Policy</Link></li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="pt-8 border-t border-slate-800/60 flex flex-col md:flex-row justify-between items-center gap-4 relative z-10 text-center md:text-left">
              <p className="text-slate-500 text-sm">&copy; 2026 Help Sathi. All rights reserved.</p>
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <span>Made with</span>
                <span className="text-rose-500 animate-pulse">❤️</span>
                <span>in India</span>
              </div>
            </div>
          </div>
          
          {/* Huge Background Text */}
          <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden flex justify-center pointer-events-none select-none opacity-20">
            <span className="text-[11vw] md:text-[180px] lg:text-[280px] font-black text-slate-800 leading-none whitespace-nowrap translate-y-1/4 md:translate-y-1/3">
              HELPSATHI
            </span>
          </div>
        </footer>
      </main>
    </div>
    </>
  );
}
