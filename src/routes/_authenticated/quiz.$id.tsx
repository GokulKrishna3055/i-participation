import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/_authenticated/quiz/$id")({
  head: () => ({ meta: [{ title: "Participation only — i++26" }, { name: "description", content: "i++26 now records verified participation only." }, { property: "og:title", content: "Participation only — i++26" }, { property: "og:description", content: "View your verified event participation credits." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => <main className="mx-auto max-w-lg px-4 pt-32"><h1 className="font-display text-4xl text-primary">Participation only</h1><p className="mt-4 text-muted-foreground">Prize trials are no longer active.</p><Button asChild className="mt-6"><Link to="/leaderboard">Leaderboard</Link></Button></main>,
});
