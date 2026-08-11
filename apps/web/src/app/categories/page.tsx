"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { 
  Sparkle, 
  MagnifyingGlass, 
  ArrowRight, 
  Users, 
  ChalkboardTeacher 
} from "@phosphor-icons/react";

interface CategoryItem {
  id?: string;
  name: string;
  icon?: string;
  description?: string;
  mentorCount?: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [totalMentors, setTotalMentors] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
          setTotalMentors(data.totalMentors || 0);
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <PublicNav />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Sparkle weight="fill" className="text-sm" /> Explore by Domain
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Browse Mentorship Categories
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Find verified rankers, toppers, and industry veterans across India&apos;s most competitive exams and high-growth professional fields.
          </p>

          {/* Search Bar */}
          <div className="pt-4 max-w-xl mx-auto">
            <div className="relative">
              <MagnifyingGlass
                weight="bold"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg"
              />
              <input
                type="text"
                placeholder="Search categories (e.g. UPSC, Engineering, Tech, MBA)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition"
              />
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-48 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 animate-pulse"
              />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
            <ChalkboardTeacher className="mx-auto text-4xl text-slate-400" />
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">No categories found</h3>
            <p className="text-xs text-slate-500">Try searching for a different keyword or view all mentors.</p>
            <Link
              href="/mentors"
              className="inline-block mt-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white"
            >
              View All Mentors
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCategories.map((cat, idx) => (
              <Link
                key={cat.id || idx}
                href={`/mentors?category=${encodeURIComponent(cat.name)}`}
                className="group relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col justify-between shadow-sm hover:shadow-xl hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      {cat.icon || "🎓"}
                    </div>
                    {cat.mentorCount !== undefined && cat.mentorCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <Users size={12} weight="bold" /> {cat.mentorCount} {cat.mentorCount === 1 ? "Mentor" : "Mentors"}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {cat.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {cat.description || "Connect with top mentors & toppers in this domain for 1-on-1 strategy."}
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                  <span>Explore Mentors</span>
                  <ArrowRight weight="bold" className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <section className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 text-center space-y-4">
          <h3 className="text-2xl sm:text-3xl font-extrabold">Are you a topper or domain specialist?</h3>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto">
            Apply to become a Help Sathi mentor and help ambitious juniors while earning flexible income on your own schedule.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white text-sm shadow-md transition"
            >
              Apply as a Mentor <ArrowRight weight="bold" />
            </Link>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
