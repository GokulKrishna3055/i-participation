import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
export const Route = createFileRoute("/_authenticated/claim/$token")({
  head: () => ({ meta: [{ title: "Attendance verification — i++26" }, { name: "description", content: "i++26 attendance requires organiser verification." }, { property: "og:title", content: "Attendance verification — i++26" }, { property: "og:description", content: "Participation credits are added after verified attendance." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => <main className="mx-auto max-w-lg px-4 pt-32"><h1 className="font-display text-4xl text-primary">Organiser verification required</h1><p className="mt-4 text-muted-foreground">Room QR codes no longer add credits. Your event organiser must verify your registration code and mark you present.</p><Button asChild className="mt-6"><Link to="/dashboard">My registrations</Link></Button></main>,
});
