export interface RoleUser {
  role?: string | null;
  adminSubRole?: string | null;
}

export interface RoleBadgeInfo {
  label: string;
  colorClass: string;
}

export function getRoleBadge(user: RoleUser | null | undefined): RoleBadgeInfo | null {
  if (!user) return null;

  if (user.adminSubRole === "SUPER_ADMIN") {
    return { label: "Super Admin", colorClass: "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 border-red-500/20" };
  }
  
  if (user.adminSubRole === "ADMIN" || user.role === "ADMIN") {
    return { label: "Admin", colorClass: "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border-purple-500/20" };
  }
  
  if (user.adminSubRole === "SUPPORT") {
    return { label: "Support Team", colorClass: "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 border-orange-500/20" };
  }
  
  if (user.adminSubRole === "MODERATOR") {
    return { label: "Moderator", colorClass: "bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400 border-yellow-500/20" };
  }

  if (user.role === "MENTOR") {
    return { label: "Verified Mentor", colorClass: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-500/20" };
  }

  return null;
}
