import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Search, Camera, Keyboard, Lock, LockOpen, Download } from "lucide-react";
import { QrScanner } from "@/components/QrScanner";
import { TeamRegistration } from "@/components/TeamRegistration";
import { exportAllExcel } from "@/lib/excel-export";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-tab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MarkResult = { status: string; credits?: number; name?: string; roll?: string; event_title?: string };

export function EventRoster({ eventId }: { eventId: string }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { data = [], isPending, error } = useQuery({
    queryKey: ["event-roster", eventId, search, page], staleTime: 15000,
    refetchInterval: 15000, refetchIntervalInBackground: false,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("event_roster", { _event_id: eventId, _search: search, _page: page });
      if (error) throw error;
      return data;
    },
  });

  async function refresh() {
    await Promise.all([qc.invalidateQueries({ queryKey: ["event-roster", eventId] }), qc.invalidateQueries({ queryKey: ["leaderboard"] })]);
  }

  async function mark(raw: string) {
    const code = raw.trim().toUpperCase();
    if (!code || busy) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("mark_attendance_by_code", { _event_id: eventId, _code: code });
      if (error) throw error;
      const r = data as MarkResult;
      if (r.status === "ok") toast.success(`${r.name} (${r.roll}) registered & present · ${r.credits} credits added`);
      else if (r.status === "already") toast.info(`${r.name} (${r.roll}) is already present for this event`);
      else if (r.status === "locked") toast.warning(`${r.name} (${r.roll}) is currently in ${r.event_title} — their organiser must release them first`);
      else if (r.status === "unknown_code") toast.error("No student found with that code");
      else if (r.status === "not_student") toast.error(`${r.name ?? "This account"} is not a student account`);
      else toast.error("You are not allowed to mark attendance for this event");
      await refresh();
    } catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }

  async function release(userId: string, name: string) {
    try {
      const { data, error } = await supabase.rpc("release_student", { _event_id: eventId, _user_id: userId });
      if (error) throw error;
      const r = data as { status: string };
      if (r.status === "released") toast.success(`${name} released — they can now join another event`);
      else toast.info(`${name} is not locked to this event`);
      await refresh();
    } catch (e) { toast.error((e as Error).message); }
  }

  return <section className="mt-6">
    <div className="glass rounded-lg p-5">
      <h3 className="font-semibold">Mark attendance</h3>
      <p className="text-sm text-muted-foreground">Scan the student's QR or type their code — this registers them for this event and locks them here until you release them.</p>
      <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; void mark(String(new FormData(f).get("code") ?? "")).then(() => f.reset()); }}>
        <Input name="code" aria-label="Student attendance code" autoComplete="off" maxLength={12} className="max-w-xs font-mono uppercase" />
        <Button type="submit" disabled={busy}><Keyboard className="h-4 w-4" />{busy ? "Marking…" : "Mark present"}</Button>
        <Button type="button" variant="outline" onClick={() => setScanning((v) => !v)}><Camera className="h-4 w-4" />{scanning ? "Close camera" : "Scan QR"}</Button>
      </form>
      {scanning && <div className="mt-4"><QrScanner onScan={(t) => void mark(t)} /></div>}
    </div>
    <TeamRegistration eventId={eventId} />
    <div className="mt-6 flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">Students</h3>
      <Button variant="outline" size="sm" disabled={exporting} onClick={async () => { setExporting(true); try { await exportAllExcel(); } catch (e) { toast.error((e as Error).message); } finally { setExporting(false); } }}><Download className="h-4 w-4" />{exporting ? "Exporting…" : "Export registration workbook"}</Button>
    </div>
    <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); setPage(0); setSearch(String(new FormData(e.currentTarget).get("search") ?? "")); }}>
      <Input name="search" aria-label="Search students" className="max-w-sm" />
      <Button type="submit" variant="outline"><Search className="h-4 w-4" /> Search</Button>
      <Button type="button" variant="ghost" onClick={() => qc.invalidateQueries({ queryKey: ["event-roster", eventId] })}>Refresh</Button>
    </form>
    <p className="mt-3 text-sm text-muted-foreground">{isPending ? "Loading students…" : `${data[0]?.total_count ?? 0} students`}</p>
    {error && <p role="alert" className="mt-4 text-destructive">Unable to load students.</p>}
    {!isPending && !error && !data.length && <p className="py-8 text-muted-foreground">No matching students.</p>}
    <div className="mt-4 divide-y border-y">{data.map((r) => <div key={r.user_id} className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div><p className="font-medium">{r.full_name}</p><p className="font-mono text-xs text-muted-foreground">{r.roll_number}{r.department ? ` · ${r.department}` : ""}</p></div>
      <div className="flex items-center gap-3">
        {r.present ? <>
          <span className="flex items-center gap-2 text-sm text-ghost"><CheckCircle2 className="h-4 w-4" /> Present · {r.credits} credits</span>
          {r.locked_here && <Button size="sm" variant="outline" onClick={() => void release(r.user_id, r.full_name)}><LockOpen className="h-4 w-4" /> Release</Button>}
        </> : r.locked_elsewhere ? <span className="flex items-center gap-2 text-sm text-primary"><Lock className="h-4 w-4" /> In {r.locked_elsewhere}</span> : <span className="text-sm text-muted-foreground">Not registered</span>}
      </div>
    </div>)}</div>
    <div className="mt-5 flex items-center gap-3"><Button variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button><span className="text-sm text-muted-foreground">Page {page + 1}</span><Button variant="outline" disabled={(page + 1) * 50 >= (data[0]?.total_count ?? 0)} onClick={() => setPage(p => p + 1)}>Next</Button></div>
  </section>;
}
