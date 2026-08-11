import { Metadata } from "next";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";

export const metadata: Metadata = {
  title: "Find Your Mentor | HelpSathi",
  description: "Browse verified mentors from UPSC, JEE, NEET, and Tech. Find the right guide for your journey.",
  openGraph: {
    title: "Find Your Mentor | HelpSathi",
    description: "Browse verified mentors from UPSC, JEE, NEET, and Tech.",
    url: "https://helpsathi.com/mentors",
  }
};

export default function MentorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <PublicNav />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
