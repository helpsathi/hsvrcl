"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MainWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isChat = pathname?.startsWith("/chats/") && pathname !== "/chats";

  return (
    <main 
      className={cn(
        "flex-1 flex flex-col min-h-0 overflow-y-auto overflow-x-hidden relative no-scrollbar h-full",
        isChat ? "pb-0" : "pb-4 md:pb-6"
      )}
    >
      {children}
      {!isChat && (
        <div className="h-4 md:h-6 shrink-0 w-full pointer-events-none" aria-hidden="true" />
      )}
    </main>
  );
}
