import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase-tab";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteUser, resetUserPassword } from "@/lib/admin.functions";
import { EventsDesk } from "@/components/EventsDesk";
import { exportAllExcel } from "@/lib/excel-export";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/admin-login" });
    const { data: admin } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!admin) throw redirect({ to: "/admin-login", replace: true });
  },
  head: () => ({ meta: [{ title: "Admin portal — i++26" }, { name: "description", content: "Assigned organisers verify i++26 participation and manage registrations." }, { property: "og:title", content: "Admin portal — i++26" }, { property: "og:description", content: "Event-specific registration and verified attendance management." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});
function Admin() {
  const { isAdmin, loading } = useAuth();
  if (loading) return <main className="pt-32 text-center text-muted-foreground">Loading…</main>;
  if (!isAdmin) return <main className="pt-32 text-center">Admins only.</main>;
  return <main className="mx-auto max-w-6xl px-4 pt-28 pb-20">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase text-ghost">i++26 · Admin</p><h1 className="mt-2 font-display text-5xl text-primary">Admin portal</h1></div><div className="flex gap-2"><Button variant="outline" onClick={async () => { try { await exportAllExcel(); } catch (e) { toast.error((e as Error).message); } }}>Export all registrations</Button><Button asChild variant="outline"><Link to="/leaderboard">Leaderboard</Link></Button></div></div>
    <Tabs defaultValue="events" className="mt-6"><TabsList><TabsTrigger value="events">Events & organisers</TabsTrigger><TabsTrigger value="users">Users</TabsTrigger></TabsList>
      <TabsContent value="events"><EventsDesk /></TabsContent><TabsContent value="users"><UsersTab /></TabsContent>
    </Tabs>
  </main>;
}
function useAdminData(page: number, search: string) {
  return useQuery({
    queryKey: ["admin-data", page, search],
    staleTime: 30000,
    queryFn: async () => {
      let profilesQuery = supabase.from("profiles").select("*", { count: "exact" }).order("roll_number").range(page * 50, page * 50 + 49);
      const safeSearch = search.replace(/[^a-zA-Z0-9 ]/g, "").trim();
      if (safeSearch) profilesQuery = profilesQuery.or(`roll_number.ilike.%${safeSearch}%,full_name.ilike.%${safeSearch}%`);
      const p = await profilesQuery;
      if (p.error) throw p.error;
      const ids = (p.data ?? []).map((x) => x.id);
      const [a, r, e] = await Promise.all([
        supabase.from("attendance").select("id, user_id, event_id, credits, created_at").not("verified_at", "is", null).in("user_id", ids),
        supabase.from("user_roles").select("user_id, role").eq("role", "admin").in("user_id", ids),
        supabase.from("events").select("id, title, category").order("starts_at"),
      ]);
      for (const result of [a, r, e]) { if (result.error) throw result.error; }
      return { profiles: p.data ?? [], count: p.count ?? 0, attendance: a.data ?? [], admins: new Set((r.data ?? []).map((x) => x.user_id)), events: e.data ?? [] };
    },
  });
}

function UsersTab() {
  const [page, setPage] = useState(0);
  const { user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data, error } = useAdminData(page, q);
  const del = useServerFn(deleteUser);
  const resetPw = useServerFn(resetUserPassword);
  if (error) return <p role="alert" className="mt-6 text-destructive">Unable to load students. Please refresh.</p>;
  const evName = Object.fromEntries((data?.events ?? []).map((e) => [e.id, e.title]));
  const rows = data?.profiles ?? [];

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-data"] });
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); toast.success(ok); refresh(); qc.invalidateQueries({ queryKey: ["leaderboard"] }); }
    catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="mt-6">
      <form onSubmit={(e) => { e.preventDefault(); setPage(0); setQ(String(new FormData(e.currentTarget).get("search") ?? "")); }} className="flex gap-2"><Input name="search" className="max-w-sm" /><Button type="submit" variant="outline">Search</Button></form>
      <p className="mt-2 text-sm text-muted-foreground">{data ? `${data.count} registered` : "Loading…"}</p>
      <div className="mt-4 space-y-3">
        {rows.map((p) => {
           const att = (data?.attendance ?? []).filter((a) => a.user_id === p.id);
           const total = att.reduce((s, a) => s + a.credits, 0);
           const admin = data?.admins.has(p.id);
          return (
            <div key={p.id} className="glass rounded-2xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{p.full_name} {admin && <Badge className="ml-1">Admin</Badge>}{p.account_type === "organiser" && <Badge variant="secondary" className="ml-1">Organiser</Badge>}</p>
                  <p className="font-mono text-xs text-muted-foreground">{p.roll_number}{p.department ? ` · ${p.department}` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="mr-2 font-display text-3xl text-primary">{total}</span>
                  <Button size="icon" variant="ghost" title="Reset password" onClick={() => {
                    const pw = prompt(`New password for ${p.roll_number} (min 6 chars)`);
                    if (pw) run(() => resetPw({ data: { userId: p.id, password: pw } }), "Password reset");
                  }}><KeyRound className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" title="Delete user" disabled={p.id === user?.id} onClick={() => {
                    if (confirm(`Delete ${p.roll_number}? This removes all their credits.`)) run(() => del({ data: { userId: p.id } }), "User deleted");
                  }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
              {att.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {att.map((a) => (
                    <span key={a.id} className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs">
                      {evName[a.event_id]} · <b className="text-primary">{a.credits}</b>
                      <button title="Revoke" className="ml-1 text-muted-foreground hover:text-destructive" onClick={() => {
                        if (confirm("Revoke these credits?")) run(async () => { const { error } = await supabase.from("attendance").delete().eq("id", a.id); if (error) throw error; }, "Credits revoked");
                      }}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-5 flex items-center gap-3"><Button variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button><span className="text-sm text-muted-foreground">Page {page + 1}</span><Button variant="outline" disabled={!data || (page + 1) * 50 >= data.count} onClick={() => setPage((p) => p + 1)}>Next</Button></div>
    </div>
  );
}

