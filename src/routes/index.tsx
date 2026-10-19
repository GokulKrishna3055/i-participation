import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { CalendarClock, MapPin, Trophy, ShieldCheck, Skull, Zap, Phone } from "lucide-react";
import video from "@/assets/haunted-intro.mp4.asset.json";
import poster from "@/assets/haunted-poster.jpg.asset.json";
import { supabase } from "@/lib/supabase-tab";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useReveal } from "@/hooks/use-reveal";
import { FEST_NAME, FEST_TAGLINE, fmtTime } from "@/lib/event-config";
import { EventRegistration } from "@/components/EventRegistration";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "i++26 — Night of the Infinite Loop | Halloween Fest" },
      { name: "description", content: "Events, timings and venues for i++26. Register once, verify participation with your organiser and earn Tech 20 or Non-Tech 15 credits." },
      { property: "og:title", content: "i++26 — Night of the Infinite Loop" },
      { property: "og:description", content: "Verified participation, event registrations and the live i++26 leaderboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: poster.url },
      { name: "twitter:image", content: poster.url },
    ],
  }),
  component: Index,
});

const tm = (d: string) => new Date(d).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

function useEvents() {
  return useQuery({
    queryKey: ["events"],
    staleTime: 120000,
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("starts_at");
      if (error) throw error;
      return data;
    },
  });
}

function Index() {
  const { user } = useAuth();
  const { data: events } = useEvents();
  const vid = useRef<HTMLVideoElement>(null);
  useReveal([events?.length]);

  return (
    <main className="overflow-x-hidden">
      {/* HERO — the video, darkened & zoomed on scroll */}
      <section className="relative h-[85svh] min-h-[520px] max-h-[760px] overflow-hidden">
        <video
          ref={vid}
          src={video.url}
          poster={poster.url}
          autoPlay muted playsInline
          onTimeUpdate={(e) => { const v = e.currentTarget; if (v.currentTime > 6.8) v.currentTime = 0.2; }}
          onEnded={(e) => { e.currentTarget.currentTime = 0.2; e.currentTarget.play(); }}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* loop stops before the original i++25 end card */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/80 to-transparent" />

        <div
          className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center"
        >
          <p className="mb-3 text-xs uppercase tracking-[0.4em] text-ghost">ISTA presents</p>
          <h1 className="font-display text-7xl leading-none text-primary text-glow  sm:text-8xl md:text-[10rem]">
            {FEST_NAME}
          </h1>
          <p className="mt-3 font-display text-3xl text-foreground md:text-5xl">{FEST_TAGLINE}</p>
          <p className="mt-5 max-w-lg text-muted-foreground">
            Enter the haunted halls. Tech: 20 credits. Non-Tech: 15 credits. Every verified participation counts.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" className="rounded-lg" asChild><Link to={user ? "/dashboard" : "/auth"}>{user ? "My registered events" : "Register with roll number"}</Link></Button>
            <Button size="lg" variant="outline" className="rounded-full" asChild><a href="#events">See events</a></Button>
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-xs text-muted-foreground ">scroll if you dare ↓</div>
      </section>

      {/* EVENTS */}
      <section id="events" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-8">
        <h2 className="font-display text-5xl text-primary md:text-6xl">Haunted Events</h2>
        <p className="reveal mt-2 text-muted-foreground">Time, venue and what awaits you inside.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {(events ?? []).map((e, i) => (
            <article key={e.id} className="reveal group glass relative overflow-hidden rounded-lg p-6 transition-colors hover:border-ghost" style={{ transitionDelay: `${(i % 2) * 100}ms` }}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-2xl font-semibold group-hover:text-primary transition-colors">{e.title}</h3>
                <Badge variant={e.category === "tech" ? "default" : "secondary"} className="shrink-0">
                  {e.category === "tech" ? "Tech" : "Non-Tech"}
                </Badge>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{e.description}</p>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <span className="flex items-center gap-1.5"><CalendarClock className="h-4 w-4 text-ghost" />{e.round2_starts_at ? "Round 1: " : ""}{fmtTime(e.starts_at)}{e.ends_at && ` – ${tm(e.ends_at)}`}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-ghost" />{e.venue}</span>
                <span className="flex items-center gap-1.5 text-primary"><Zap className="h-4 w-4" />{e.credits} credits</span>
              </div>
              {e.round2_starts_at && (
                <p className="mt-2 flex items-center gap-1.5 text-sm"><CalendarClock className="h-4 w-4 text-ghost" />Round 2: {tm(e.round2_starts_at)}{e.round2_ends_at && ` – ${tm(e.round2_ends_at)}`}</p>
              )}
              {e.timing_note && <p className="mt-1 text-xs text-primary">⏳ {e.timing_note}</p>}
              {e.poc && <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground"><Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ghost" />{e.poc}</p>}
              
            </article>
          ))}
          {events?.length === 0 && <p className="text-muted-foreground">Events will rise soon…</p>}
        </div>
      </section>

      <section className="px-4 pb-28 text-center">
        <div className="reveal">
          <h2 className="font-display text-5xl text-foreground md:text-6xl">Who rules the night?</h2>
          <Button size="lg" className="mt-6 rounded-lg" asChild><Link to="/leaderboard">View leaderboard</Link></Button>
        </div>
      </section>
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">i++26 · ISTA · Happy haunting</footer>
    </main>
  );
}
