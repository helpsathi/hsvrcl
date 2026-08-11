import { ServicesClient } from "./ServicesClient";

export const metadata = {
  title: "Connected Services | Admin | HelpSathi",
  description: "Manage and view third-party service connections.",
};

export default function ServicesPage() {
  const services = [
    {
      id: "neon",
      name: "Neon",
      description: "PostgreSQL Database Connection",
      configured: !!process.env.DATABASE_URL,
      dashboardUrl: "https://console.neon.tech/",
      iconName: "Database",
      color: "blue"
    },
    {
      id: "razorpay",
      name: "Razorpay",
      description: "Payment Gateway",
      configured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      dashboardUrl: "https://dashboard.razorpay.com/",
      iconName: "CreditCard",
      color: "indigo"
    },
    {
      id: "imagekit",
      name: "ImageKit",
      description: "Cloud Image & File Storage",
      configured: !!process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
      dashboardUrl: "https://imagekit.io/dashboard",
      iconName: "ImageSquare",
      color: "purple"
    },
    {
      id: "google",
      name: "Google Cloud",
      description: "OAuth & Meet Integration",
      configured: !!process.env.GOOGLE_CLIENT_ID,
      dashboardUrl: "https://console.cloud.google.com/",
      iconName: "GoogleLogo",
      color: "red"
    },
    {
      id: "aws",
      name: "AWS",
      description: "Cloud Services Infrastructure",
      configured: !!(process.env.AWS_ACCESS_KEY_ID || process.env.AWS_REGION),
      dashboardUrl: "https://console.aws.amazon.com/",
      iconName: "Cloud",
      color: "orange"
    },
    {
      id: "github",
      name: "GitHub",
      description: "Version Control & CI/CD",
      configured: !!(process.env.GITHUB_TOKEN || process.env.GITHUB_CLIENT_ID),
      dashboardUrl: "https://github.com/",
      iconName: "GithubLogo",
      color: "slate"
    },
    {
      id: "vercel",
      name: "Vercel",
      description: "Hosting & Cron Jobs",
      configured: !!process.env.CRON_SECRET,
      dashboardUrl: "https://vercel.com/dashboard",
      iconName: "Triangle",
      color: "slate"
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Connected Services</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Monitor the status of your third-party integrations and securely access their dashboards.
          </p>
        </div>
      </div>
      
      <ServicesClient services={services} />
    </div>
  );
}
