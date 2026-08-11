import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { MainWrapper } from "@/components/layout/MainWrapper";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  
  if (!session) {
    redirect("/login?error=session_expired");
  }

  if (!session.profileComplete) {
    redirect("/profile-setup");
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[100dvh] max-h-[100dvh] md:h-screen md:max-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <Sidebar />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Global App Header */}
        <Header />

        {/* Scrollable Content Area */}
        <MainWrapper>
          {children}
        </MainWrapper>

        {/* Mobile Navigation (Hidden on Desktop) */}
        <MobileNav />
      </div>
    </div>
  );
}
