import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Ghost } from "lucide-react";
import { supabase } from "@/lib/supabase-tab";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export function SiteNav() {
  const { user, isAdmin, isOrganiser, profile } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut({ scope: "local" });
    navigate({ to: isOrganiser ? "/organiser-login" : "/auth", replace: true });
  }

  const link = "text-sm text-muted-foreground hover:text-primary transition-colors";
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav className="mx-auto mt-3 flex max-w-6xl items-center justify-between gap-3 rounded-full glass px-4 py-2 mx-3 md:mx-auto">
        <Link to="/" className="flex items-center gap-2 font-display text-2xl text-primary text-glow">
          <Ghost className="h-5 w-5 text-ghost " /> i++26
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-2 md:gap-5">
          <Link to="/leaderboard" className={link}>Leaderboard</Link>
          {user && !isAdmin && !isOrganiser && <Link to="/dashboard" className={link}>{profile?.roll_number ?? "Me"}</Link>}
          {isAdmin && <Link to="/admin" className={link}>Admin portal</Link>}
          {isOrganiser && !isAdmin && <Link to="/organiser-login" className={link}>Organiser portal</Link>}
          {user ? (
            <Button size="sm" variant="outline" className="rounded-full" onClick={signOut}>Sign out</Button>
          ) : (
            <Button size="sm" className="rounded-full" asChild><Link to="/auth">Student login</Link></Button>
          )}
        </div>
      </nav>
    </header>
  );
}
