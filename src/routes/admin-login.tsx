import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-tab";
import { useAuth, rollToEmail } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInPortal } from "@/lib/portal-auth";

export const Route = createFileRoute("/admin-login")({
  head: () => ({ meta: [
    { title: "Admin sign in — i++26" }, { name: "description", content: "Administrator access to assign organisers and manage i++26 users." },
    { property: "og:title", content: "Admin sign in — i++26" }, { property: "og:description", content: "Admin portal for the Night of the Infinite Loop." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }), component: AdminLogin,
});
function AdminLogin() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!loading && !busy && user && isAdmin) navigate({ to: "/admin", replace: true }); }, [user, isAdmin, loading, busy, navigate]);
  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true);
    const f = new FormData(e.currentTarget);
    try {
      await signInPortal("admin", rollToEmail(String(f.get("roll"))), String(f.get("password")));
      await navigate({ to: "/admin", replace: true });
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center px-4 pt-24 pb-12"><div className="w-full max-w-md glass rounded-2xl p-8">
    <h1 className="font-display text-4xl text-primary">Admin sign in</h1>
    <form onSubmit={login} className="mt-6 space-y-4">
      <div><Label htmlFor="a-roll">Roll number</Label><Input id="a-roll" name="roll" required autoComplete="username" /></div>
      <div><Label htmlFor="a-password">Password</Label><Input id="a-password" name="password" type="password" required autoComplete="current-password" /></div>
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Checking…" : "Admin sign in"}</Button>
    </form>
    <Link to="/auth" className="mt-5 block text-sm text-ghost">Student sign in</Link>
  </div></main>;
}
