"use client";

import { 
  Database, 
  CreditCard, 
  ImageSquare, 
  GoogleLogo,
  Cloud,
  GithubLogo,
  Triangle,
  CheckCircle,
  XCircle,
  ArrowSquareOut
} from "@phosphor-icons/react";

interface Service {
  id: string;
  name: string;
  description: string;
  configured: boolean;
  dashboardUrl: string;
  iconName: string;
  color: string;
}

export function ServicesClient({ services }: { services: Service[] }) {
  const getIcon = (iconName: string, colorClass: string) => {
    const props = { weight: "duotone" as const, className: `text-3xl ${colorClass}` };
    switch (iconName) {
      case "Database": return <Database {...props} />;
      case "CreditCard": return <CreditCard {...props} />;
      case "ImageSquare": return <ImageSquare {...props} />;
      case "GoogleLogo": return <GoogleLogo {...props} />;
      case "Cloud": return <Cloud {...props} />;
      case "GithubLogo": return <GithubLogo {...props} />;
      case "Triangle": return <Triangle {...props} />;
      default: return <Database {...props} />;
    }
  };

  const getColorClasses = (color: string) => {
    switch(color) {
      case 'blue': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'indigo': return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'purple': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      case 'red': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      case 'orange': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400';
      case 'slate': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
      default: return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => (
        <div 
          key={service.id} 
          className="bg-white dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col group hover:-translate-y-1"
        >
          <div className="p-6 flex-1">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl transition-colors ${getColorClasses(service.color)}`}>
                {getIcon(service.iconName, "")}
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                service.configured 
                  ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20' 
                  : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
              }`}>
                {service.configured ? (
                  <><CheckCircle weight="fill" className="text-sm" /> Connected</>
                ) : (
                  <><XCircle weight="fill" className="text-sm" /> Disconnected</>
                )}
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {service.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
              {service.description}
            </p>
          </div>
          
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <a 
              href={service.dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-gradient-to-r hover:from-blue-600 hover:to-purple-600 hover:text-white hover:border-transparent text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-all shadow-sm group-hover:shadow-md"
            >
              Go to Dashboard
              <ArrowSquareOut weight="bold" className="text-lg" />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
