import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | HelpSathi",
  description: "Get in touch with the HelpSathi team for support, queries, partnerships, and feedback. We're here to assist your mentorship journey.",
  openGraph: {
    title: "Contact Us | HelpSathi",
    description: "Get in touch with the HelpSathi team for support.",
    url: "https://helpsathi.com/contact",
  }
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
