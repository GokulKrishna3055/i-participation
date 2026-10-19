import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-tab";
import { useAuth, rollToEmail } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInPortal } from "@/lib/portal-auth";

export const Route = createFileRoute("/organiser-login")({
  head: () => ({ meta: [
    { title: "Organiser sign in — i++26" }, { name: "description", content: "Authorised i++26 organisers manage event registrations and verified attendance." },
    { property: "og:title", content: "Organiser sign in — i++26" }, { property: "og:description", content: "Coordinator access for the Night of the Infinite Loop." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: OrganiserLogin,
});
function OrganiserLogin() {
  const { user, isOrganiser, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [assigned, setAssigned] = useState(false);
  useEffect(() => {
    if (loading || busy || !user || !isOrganiser) return;
    let cancelled = false;
    supabase.rpc("is_event_organiser").then(({ data }) => {
      if (cancelled) return;
      setAssigned(!!data);
      if (data) navigate({ to: "/organiser-desk", replace: true });
    });
    return () => { cancelled = true; };
  }, [user, isOrganiser, loading, busy, navigate]);
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      await signInPortal("organiser", rollToEmail(String(f.get("roll"))), String(f.get("password")));
      const { data: assigned } = await supabase.rpc("is_event_organiser");
      refresh();
      if (assigned) await navigate({ to: "/organiser-desk", replace: true });
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center px-4 pt-24 pb-12"><div className="w-full max-w-md glass rounded-2xl p-8">
    <h1 className="font-display text-4xl text-primary">Organiser sign in</h1>
    {user && !loading && isOrganiser && !assigned ? <div className="mt-6 space-y-4"><p role="status" className="text-muted-foreground">Your account is waiting for an admin to assign an event. Share your roll number with an admin.</p><Button onClick={refresh}>Check assignment</Button></div> : <form onSubmit={login} className="mt-6 space-y-4">
      <div><Label htmlFor="o-roll">Roll number</Label><Input id="o-roll" name="roll" required autoComplete="username" /></div>
      <div><Label htmlFor="o-password">Password</Label><Input id="o-password" name="password" type="password" required autoComplete="current-password" /></div>
      <Button type="submit" className="w-full" disabled={busy || loading}>{busy ? "Checking access…" : "Organiser sign in"}</Button>
    </form>}
    <Link to="/organiser-register" className="mt-5 block text-sm text-ghost">New organiser? Register here</Link>
    <Link to="/auth" className="mt-5 block text-sm text-ghost">Student registration & sign in</Link>
  </div></main>;
}