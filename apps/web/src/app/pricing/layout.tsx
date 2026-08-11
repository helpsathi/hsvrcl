import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | HelpSathi - Mentors Set Their Rates",
  description: "HelpSathi has zero platform access fees. Mentors set their own per-minute rates for instant chats and video calls. Discover our fair billing models.",
  openGraph: {
    title: "Pricing | HelpSathi",
    description: "HelpSathi has zero platform access fees. Discover our fair billing models.",
    url: "https://helpsathi.com/pricing",
  }
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
