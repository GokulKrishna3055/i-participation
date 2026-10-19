import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase-tab";
import { Button } from "@/components/ui/button";
import { EventsDesk } from "@/components/EventsDesk";

export const Route = createFileRoute("/_authenticated/organiser-desk")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/organiser-login" });
    const { data: organiser } = await supabase.rpc("is_event_organiser");
    if (!organiser) throw redirect({ to: "/organiser-login", replace: true });
  },
  head: () => ({ meta: [{ title: "Organiser desk — i++26" }, { name: "description", content: "Mark verified attendance for your assigned i++26 event." }, { property: "og:title", content: "Organiser desk — i++26" }, { property: "og:description", content: "Scan or enter student codes to mark attendance." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: OrganiserDesk,
});

function OrganiserDesk() {
  return <main className="mx-auto max-w-6xl px-4 pt-28 pb-20">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase text-ghost">i++26 · Organiser</p><h1 className="mt-2 font-display text-5xl text-primary">Attendance desk</h1></div><Button asChild variant="outline"><Link to="/leaderboard">Leaderboard</Link></Button></div>
    <EventsDesk />
  </main>;
}
