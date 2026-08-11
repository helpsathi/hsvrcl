import { redirect } from "next/navigation";

export default function DashboardAnnouncementsRedirect() {
  redirect("/announcements");
}
