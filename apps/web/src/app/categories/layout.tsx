import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentorship Categories | HelpSathi",
  description: "Explore mentorship categories on HelpSathi including UPSC, JEE, NEET, Software Engineering, Product Management, and more.",
  openGraph: {
    title: "Mentorship Categories | HelpSathi",
    description: "Explore mentorship categories on HelpSathi.",
    url: "https://helpsathi.com/categories",
  }
};

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
