import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, UserRoundCheck } from "lucide-react";
import { supabase } from "@/lib/supabase-tab";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { assignEventOrganiser } from "@/lib/admin.functions";
import { fmtTime } from "@/lib/event-config";
import { EventRoster } from "@/components/EventRoster";
import { participationCredits } from "@/lib/participation-rules";

export function EventsDesk() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const assign = useServerFn(assignEventOrganiser);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const { data: assignments = [], isPending: assignmentsPending, error: assignmentsError } = useQuery({ queryKey: ["organiser-assignments"], staleTime: 30000, refetchInterval: 30000, refetchIntervalInBackground: false, queryFn: async () => {
    const { data, error } = await supabase.from("event_organisers").select("event_id,user_id,profiles(full_name,roll_number)");
    if (error) throw error; return data;
  }});
  const { data: events = [], error } = useQuery({ queryKey: ["desk-events"], staleTime: 120000, queryFn: async () => {
    const { data, error } = await supabase.from("events").select("*").order("starts_at"); if (error) throw error; return data;
  }});
  const visible = isAdmin ? events : events.filter(e => assignments.some(a => a.event_id === e.id));
  const current = visible.find(e => e.id === selected);
  async function allocate(e: React.FormEvent<HTMLFormElement>, eventId: string) {
    e.preventDefault(); setBusy(eventId);
    try { const result = await assign({ data: { eventId, rollNumber: String(new FormData(e.currentTarget).get("roll")) } }); toast.success(`${result.name} assigned`); await qc.invalidateQueries({ queryKey: ["organiser-assignments"] }); }
    catch (e) { toast.error((e as Error).message); } finally { setBusy(null); }
  }
  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = e.currentTarget; const f = new FormData(form); setBusy("create");
    try {
      const category = f.get("category") === "non_tech" ? "non_tech" : "tech";
      const { error } = await supabase.from("events").insert({ title: String(f.get("title")), description: String(f.get("description")), venue: String(f.get("venue")), starts_at: new Date(String(f.get("starts_at"))).toISOString(), category, credits: participationCredits(category) });
      if (error) throw error; toast.success("Event created"); form.reset(); await Promise.all([qc.invalidateQueries({ queryKey: ["desk-events"] }), qc.invalidateQueries({ queryKey: ["events"] })]);
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(null); }
  }
  if (current) return <div className="mt-6"><Button variant="ghost" onClick={() => setSelected(null)}>← All events</Button><h2 className="mt-4 text-2xl font-semibold">{current.title}</h2><p className="mt-1 text-sm text-muted-foreground">{current.venue} · {participationCredits(current.category)} participation credits</p><EventRoster key={current.id} eventId={current.id} /></div>;
  return <div className="mt-6">
    {(error || assignmentsError) && <p role="alert" className="text-destructive">Unable to load assigned events. Please refresh.</p>}
    {!isAdmin && !visible.length && <p className="py-8 text-muted-foreground">{assignmentsPending ? "Loading assigned events…" : "No events assigned to you yet."}</p>}
    <div className="grid gap-4 md:grid-cols-2">{visible.map(ev => {
      const assignment = assignments.find(a => a.event_id === ev.id);
      return <article key={ev.id} className="rounded-lg border bg-card p-5">
        <div className="flex items-start justify-between gap-3"><h2 className="text-xl font-semibold">{ev.title}</h2><Badge variant="secondary">{ev.category === "tech" ? "Tech" : "Non-Tech"}</Badge></div>
        <p className="mt-2 text-sm text-muted-foreground">{fmtTime(ev.starts_at)} · {ev.venue}</p>
        <p className="mt-3 flex items-center gap-2 text-sm text-ghost"><UserRoundCheck className="h-4 w-4" />{assignment?.profiles?.full_name ?? "Organiser not assigned"}</p>
        {isAdmin && <form className="mt-4 flex gap-2" onSubmit={e => allocate(e, ev.id)}><Input name="roll" aria-label={`Organiser roll number for ${ev.title}`} required defaultValue={assignment?.profiles?.roll_number ?? ""} /><Button type="submit" variant="outline" disabled={busy === ev.id}>{busy === ev.id ? "Saving…" : "Assign"}</Button></form>}
         <Button className="mt-4 w-full" onClick={() => setSelected(ev.id)}>Manage attendance</Button>
      </article>;
    })}</div>
    {isAdmin && <form onSubmit={create} className="mt-10 space-y-4 border-t pt-6"><h2 className="flex items-center gap-2 text-xl font-semibold"><Plus className="h-5 w-5" />New event</h2><div className="grid gap-4 md:grid-cols-2"><div><Label htmlFor="new-title">Title</Label><Input id="new-title" name="title" required /></div><div><Label htmlFor="new-venue">Venue</Label><Input id="new-venue" name="venue" required /></div><div><Label htmlFor="new-start">Starts</Label><Input id="new-start" name="starts_at" type="datetime-local" required /></div><div><Label htmlFor="new-category">Category</Label><select id="new-category" name="category" className="h-9 w-full rounded-md border bg-background px-2"><option value="tech">Tech · 20 credits</option><option value="non_tech">Non-Tech · 15 credits</option></select></div></div><div><Label htmlFor="new-description">Description</Label><Textarea id="new-description" name="description" /></div><Button type="submit" disabled={busy === "create"}>Create event</Button></form>}
  </div>;
}
