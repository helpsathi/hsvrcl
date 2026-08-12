import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { GlobalChatNotification } from "@/components/notifications/GlobalChatNotification";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";
import { Analytics } from "@vercel/analytics/next";
const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://helpsathi.com"),
  title: "HelpSathi | Learn from the Best Mentors",
  description: "Connect with expert mentors for UPSC, JEE, NEET, Software Engineering, and more. Get personalized 1-on-1 guidance, live chat, and mentorship.",
  keywords: ["mentorship", "tutors", "UPSC prep", "JEE prep", "career guidance", "online learning", "live chat"],
  authors: [{ name: "HelpSathi Team" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://helpsathi.com",
    siteName: "HelpSathi",
    title: "HelpSathi | Online Mentorship Platform",
    description: "Get 1-on-1 personalized guidance from top industry experts and exam toppers.",
    images: [
      {
        url: "https://helpsathi.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "HelpSathi Mentorship Platform",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HelpSathi | Mentorship Platform",
    description: "Connect with expert mentors, get personalized guidance, and achieve your goals with Help Sathi.",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    other: [
      {
        rel: "icon",
        url: "/icon-192x192.png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HelpSathi",
  },
};

export const viewport = {
  themeColor: "#10b981", // brand-main
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)} suppressHydrationWarning>
      <body className={`${plusJakartaSans.variable} font-sans antialiased bg-background text-foreground min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <ToastProvider>
              {children}
              <GlobalChatNotification />
              <PwaInstallPrompt />
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
