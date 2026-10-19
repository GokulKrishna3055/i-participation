import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Zap, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase-tab";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Badge } from "@/components/ui/badge";
import { EventRegistration, useRegistrations } from "@/components/EventRegistration";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "My Credits — i++26" }, { name: "description", content: "Your i++26 registrations, verified attendance and credits." }, { property: "og:title", content: "My Credits — i++26" }, { property: "og:description", content: "Your registered events and participation credits." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, profile, isAdmin, isOrganiser, loading } = useAuth();
  const { data: registrations = [] } = useRegistrations();
  const { data: att = [] } = useQuery({
    queryKey: ["my-attendance", user?.id],
    enabled: !!user && !loading && !isAdmin && !isOrganiser,
    staleTime: 15000,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("attendance").select("id, credits, created_at, events(title, category, venue)").eq("user_id", user.id).not("verified_at", "is", null).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: myTeams = [] } = useQuery({
    queryKey: ["my-teams", user?.id], enabled: !!user && !loading && !isAdmin && !isOrganiser, staleTime: 30000,
    queryFn: async () => {
      const { data, error } = await supabase.from("team_members").select("event_id, teams(team_code)").eq("user_id", user!.id);
      if (error) throw error; return data;
    },
  });
  const teamFor = (eventId: string) => myTeams.find((t) => t.event_id === eventId)?.teams?.team_code;
  const total = att.reduce((s, a) => s + a.credits, 0);
  const lockedTitle = registrations.find((r) => r.event_id === profile?.locked_event_id)?.events?.title ?? null;

  if (loading) return <main className="pt-28 text-center text-muted-foreground">Loading…</main>;
  if (isAdmin || isOrganiser) return <main className="mx-auto max-w-4xl px-4 pt-28 pb-20"><h1 className="font-display text-5xl text-primary">Attendance desk</h1><p className="mt-4 text-muted-foreground">{profile?.full_name}</p><div className="mt-6 flex flex-wrap gap-3"><Button asChild><Link to={isAdmin ? "/admin" : "/organiser-desk"}>{isAdmin ? "Admin portal" : "Attendance desk"}</Link></Button><Button asChild variant="outline"><Link to="/leaderboard">Leaderboard</Link></Button></div></main>;

  return (
    <main className="mx-auto max-w-4xl px-4 pt-28 pb-20">
      <div className="border-b pb-8">
        <p className="text-sm text-muted-foreground">Welcome back,</p>
        <h1 className="font-display text-5xl text-primary">{profile?.full_name}</h1>
        <p className="font-mono text-sm text-muted-foreground">{profile?.roll_number}</p>
        <div className="mt-6 flex items-end gap-2">
          <span className="font-display text-7xl text-primary text-glow">{total}</span>
          <span className="mb-3 text-muted-foreground">credits · {att.length} events</span>
        </div>
        {profile?.student_code && <div className="mt-6 flex flex-wrap items-center gap-5 glass rounded-lg p-5"><div className="rounded-lg bg-foreground p-2"><QRCodeSVG value={profile.student_code} size={120} /></div><div><p className="text-xs uppercase text-muted-foreground">Your one attendance code</p><p className="font-mono text-3xl text-ghost tracking-widest">{profile.student_code}</p><p className="mt-1 text-sm text-muted-foreground">Show this QR or code to an event's organiser — they register you and mark you present.</p>{lockedTitle && <p className="mt-2 flex items-center gap-1.5 text-sm text-primary"><Lock className="h-4 w-4" /> You're currently in {lockedTitle} — the organiser must release you before you join another event.</p>}</div></div>}
      </div>

      <section className="mt-8"><h2 className="font-display text-3xl text-ghost">My registered events</h2>
        {registrations.length === 0 && <Button asChild variant="outline" className="mt-4"><Link to="/" hash="events">Find an event</Link></Button>}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">{registrations.map((r) => <div key={r.id} className="glass rounded-lg p-5"><h3 className="font-semibold">{r.events?.title}</h3><p className="text-sm text-muted-foreground">{r.events?.venue}</p><p className="mt-1 font-mono text-xs text-ghost">{teamFor(r.event_id) ? `Team ${teamFor(r.event_id)}` : "Individual"}</p><EventRegistration eventId={r.event_id} title={r.events?.title ?? "Event"} /></div>)}</div>
      </section>
      <section className="mt-8">
        <h2 className="font-display text-3xl text-ghost">Verified participation</h2>
        <div className="mt-4 space-y-2">
          {att.length === 0 && <p className="text-muted-foreground">No credits yet. Go find an event!</p>}
          {att.map((a) => (
            <div key={a.id} className="glass flex items-center justify-between rounded-lg px-5 py-3">
              <div>
                <p className="font-medium">{a.events?.title}</p>
                <p className="text-xs text-muted-foreground">{a.events?.venue}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{a.events?.category === "tech" ? "Tech" : "Non-Tech"}</Badge>
                <span className="flex items-center gap-1 text-primary"><Zap className="h-4 w-4" />{a.credits}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <div className="mt-8 text-center">
        <Button asChild variant="outline" className="rounded-full"><Link to="/leaderboard"><Trophy className="h-4 w-4" /> Leaderboard</Link></Button>
      </div>
    </main>
  );
}