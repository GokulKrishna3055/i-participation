import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase-tab";

export const Route = createFileRoute("/_authenticated/ticket/$token")({
  head: () => ({ meta: [
    { title: "Registration check — i++26" }, { name: "description", content: "Organiser verification of an i++26 registration ticket." },
    { property: "og:title", content: "Registration check — i++26" }, { property: "og:description", content: "Verify a student event registration." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }), component: Ticket,
});
function Ticket() {
  const { token } = Route.useParams();
  const { data, error, isPending } = useQuery({ queryKey: ["ticket-check", token], retry: false, queryFn: async () => {
    const { data, error } = await supabase.rpc("check_registration_ticket", { _token: token }); if (error) throw error; return data;
  }});
  return <main className="mx-auto max-w-lg px-4 pt-28"><h1 className="font-display text-4xl text-primary">Registration check</h1>
    {isPending ? <p className="mt-6">Checking…</p> : error ? <p className="mt-6 text-muted-foreground">Only organisers can verify registration tickets.</p> : !data?.length ? <p className="mt-6">Ticket not found.</p> : data.map((r) => <div key={r.roll_number} className="mt-6 space-y-2 border-y py-5"><p className="text-ghost">Valid registration</p><h2 className="text-xl">{r.full_name}</h2><p>{r.roll_number}</p><p>{r.event_title}</p></div>)}
  </main>;
}