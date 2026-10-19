import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Crown } from "lucide-react";
import { useLeaderboard } from "@/lib/leaderboard";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — i++26" },
      { name: "description", content: "Live credits leaderboard for every i++26 participant." },
      { property: "og:title", content: "Leaderboard — i++26" },
      { property: "og:description", content: "Who rules the Night of the Infinite Loop?" },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Leaderboard,
});

type Tab = "total" | "tech" | "non_tech";

function Leaderboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("total");
  const [page, setPage] = useState(0);
  const { data = [], isLoading, error } = useLeaderboard(tab, page);
  const ranked = data.map(row => ({ row, rank: row.rank, score: row[tab] }));

  return (
    <main className="mx-auto max-w-4xl px-4 pt-28 pb-20">
      <h1 className="text-center font-display text-6xl text-primary text-glow">Leaderboard</h1>
      <div className="mx-auto mt-8 flex w-fit gap-1 rounded-full glass p-1">
        {([["total", "Overall"], ["tech", "Tech"], ["non_tech", "Non-Tech"]] as [Tab, string][]).map(([k, l]) => (
          <Button key={k} variant={tab === k ? "default" : "ghost"} size="sm" onClick={() => { setTab(k); setPage(0); }} className="rounded-full">{l}</Button>
        ))}
      </div>
      <div className="mt-8 overflow-hidden rounded-2xl glass">
        {error && <p role="alert" className="p-6 text-destructive">Unable to load credits. Please refresh.</p>}
        {isLoading && <p className="p-6 text-center text-muted-foreground">Summoning scores…</p>}
        {!isLoading && ranked.length === 0 && <p className="p-6 text-center text-muted-foreground">No souls yet.</p>}
        {ranked.map(({ row, rank, score }) => (
          <div key={row.user_id} className={cn("flex items-center gap-4 border-b px-5 py-3 last:border-0", row.user_id === user?.id && "bg-primary/10")}>
            <span className={cn("w-8 text-center font-display text-2xl", rank === 1 ? "text-primary" : rank <= 3 ? "text-ghost" : "text-muted-foreground")}>
              {rank === 1 ? <Crown className="mx-auto h-6 w-6" /> : rank}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{row.full_name}</p>
              <p className="font-mono text-xs text-muted-foreground">{row.roll_number}{row.department ? ` · ${row.department}` : ""}</p>
            </div>
            <span className="text-xs text-muted-foreground">{row.events_count} events</span>
            <span className="w-14 text-right font-display text-2xl text-primary">{score}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-center gap-3"><Button variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Previous</Button><span className="text-sm text-muted-foreground">Page {page + 1}</span><Button variant="outline" disabled={(page + 1) * 50 >= (data[0]?.total_count ?? 0)} onClick={() => setPage(p => p + 1)}>Next</Button></div>
    </main>
  );
}
