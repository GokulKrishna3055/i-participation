import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Users, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-tab";
import { QrScanner } from "@/components/QrScanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadEventTeams } from "@/lib/event-teams";


type R = { status: string; team_code?: string; members?: number; name?: string; roll?: string; event_title?: string; code?: string };

export function TeamRegistration({ eventId }: { eventId: string }) {
  const qc = useQueryClient();
  const [codes, setCodes] = useState(["", "", ""]);
  const [scan, setScan] = useState(false);
  const [busy, setBusy] = useState(false);
  const { data: teams = [] } = useQuery({
    queryKey: ["event-teams", eventId], staleTime: 15000, refetchInterval: 15000, refetchIntervalInBackground: false,
    queryFn: () => loadEventTeams(eventId),

  });
  const addScanned = (raw: string) => setCodes((c) => {
    const v = raw.trim().toUpperCase();
    if (!v || c.includes(v)) return c;
    const i = c.findIndex((x) => !x);
    if (i < 0) { toast.info("Team already has 3 members"); return c; }
    const n = [...c]; n[i] = v; toast.success(`Added ${v}`); return n;
  });
  async function submit() {
    const list = codes.map((c) => c.trim().toUpperCase()).filter(Boolean);
    if (!list.length) { toast.error("Add at least one member code"); return; }
    if (new Set(list).size !== list.length) { toast.error("Same code entered twice"); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("register_team", { _event_id: eventId, _codes: list });
      if (error) throw error;
      const r = data as R;
      if (r.status === "ok") { toast.success(`Team ${r.team_code} registered · ${r.members} member(s) present`); setCodes(["", "", ""]); setScan(false); }
      else if (r.status === "locked") toast.warning(`${r.name} (${r.roll}) is in ${r.event_title} — release them first`);
      else if (r.status === "in_team") toast.warning(`${r.name} (${r.roll}) is already in team ${r.team_code} for this event`);
      else if (r.status === "unknown_code") toast.error(`No student with code ${r.code}`);
      else if (r.status === "not_student") toast.error(`${r.name} is not a student account`);
      else if (r.status === "bad_size") toast.error("A team needs 1 to 3 members");
      else toast.error("You are not allowed to register teams for this event");
      await Promise.all(["event-teams", "event-roster"].map((k) => qc.invalidateQueries({ queryKey: [k, eventId] })));
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }
  return <div className="glass mt-4 rounded-lg p-5">
    <h3 className="flex items-center gap-2 font-semibold"><Users className="h-4 w-4" /> Register a team (1–3 members)</h3>
    <p className="text-sm text-muted-foreground">Scan or type each member's code. The team gets an ID, and every member is registered, marked present and locked here.</p>
    <div className="mt-3 grid gap-2 sm:grid-cols-3">{codes.map((c, i) => <div key={i}><label className="mb-1 block text-xs text-muted-foreground">Member {i + 1} code</label><div className="flex gap-1">
      <Input value={c} onChange={(e) => setCodes((p) => p.map((x, j) => j === i ? e.target.value.toUpperCase() : x))} aria-label={`Member ${i + 1} code`} maxLength={12} className="font-mono uppercase" />
      {c && <Button type="button" size="icon" variant="ghost" aria-label="Clear" onClick={() => setCodes((p) => p.map((x, j) => j === i ? "" : x))}><X className="h-4 w-4" /></Button>}
    </div></div>)}</div>
    <div className="mt-3 flex flex-wrap gap-2">
      <Button onClick={() => void submit()} disabled={busy}>{busy ? "Registering…" : "Register team"}</Button>
      <Button variant="outline" onClick={() => setScan((v) => !v)}><Camera className="h-4 w-4" />{scan ? "Close camera" : "Scan members"}</Button>
    </div>
    {scan && <div className="mt-4"><QrScanner onScan={addScanned} /></div>}
    {teams.length > 0 && <div className="mt-5 space-y-2"><p className="text-sm font-medium">{teams.length} team(s)</p>{teams.map((t) => <div key={t.id} className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm"><span className="font-mono text-ghost">{t.team_code}</span><span className="text-muted-foreground">{t.members.map((m) => [m.full_name, m.roll_number ? `(${m.roll_number})` : ""].filter(Boolean).join(" ")).join(", ")}</span></div>)}</div>}
  </div>;
}
