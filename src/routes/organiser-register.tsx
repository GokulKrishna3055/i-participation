import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-tab";
import { useAuth, rollToEmail } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/PasswordField";
import { passwordError } from "@/lib/password-rules";

export const Route = createFileRoute("/organiser-register")({
  head: () => ({ meta: [
    { title: "Organiser registration — i++26" },
    { name: "description", content: "Create your i++26 organiser account with your name and roll number." },
    { property: "og:title", content: "Organiser registration — i++26" },
    { property: "og:description", content: "Register as an organiser for Night of the Infinite Loop." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: OrganiserRegister,
});

function OrganiserRegister() {
  const { user, loading, isOrganiser } = useAuth();
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(false);
  async function signup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const roll = String(f.get("roll")).trim(), name = String(f.get("name")).trim(), password = String(f.get("password"));
    if (!/^[A-Za-z0-9]{3,20}$/.test(roll)) { toast.error("Roll number must be 3–20 letters or numbers"); return; }
    if (name.length < 2 || name.length > 80) { toast.error("Enter your full name"); return; }
    const pwErr = passwordError(password); if (pwErr) { toast.error(`Password needs: ${pwErr}`); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email: rollToEmail(roll), password, options: { data: { roll_number: roll.toUpperCase(), full_name: name, department: null, account_type: "organiser" } } });
      if (error) throw error;
      if (!data.user || data.user.identities?.length === 0) throw new Error("This roll number is already registered. Please sign in.");
      setCreated(true);
    } catch (e) { toast.error((e as Error).message.includes("registered") ? "This roll number is already registered. Please sign in." : (e as Error).message); }
    finally { setBusy(false); }
  }
  return <main className="flex min-h-screen items-center justify-center px-4 pt-24 pb-12"><div className="w-full max-w-md glass rounded-lg p-8">
    <h1 className="font-display text-4xl text-primary">Organiser registration</h1>
    {created ? <div className="mt-6 space-y-4"><p role="status">Account created. Share your roll number with an admin to have your event assigned.</p><Button asChild><Link to="/organiser-login">Organiser sign in</Link></Button></div> : user && !loading ? <div className="mt-6 space-y-4"><p>{isOrganiser ? "Your organiser account is already registered. An admin must assign your event." : "This tab is signed in with a different account. Sign out here to register an organiser."}</p>{isOrganiser ? <Button asChild><Link to="/organiser-login">Continue to organiser sign in</Link></Button> : <Button onClick={() => supabase.auth.signOut({ scope: "local" })}>Sign out of this tab</Button>}</div> : <form onSubmit={signup} className="mt-6 space-y-4">
      <div><Label htmlFor="os-name">Full name</Label><Input id="os-name" name="name" required autoComplete="name" /></div>
      <div><Label htmlFor="os-roll">Roll number</Label><Input id="os-roll" name="roll" required autoComplete="username" /></div>
      <PasswordField id="os-password" />
      <p className="text-sm text-muted-foreground">An admin must assign your event before you can open the event desk.</p>
      <Button type="submit" className="w-full" disabled={busy || loading}>{busy ? "Creating…" : "Register as organiser"}</Button>
    </form>}
    <Link to="/organiser-login" className="mt-5 block text-sm text-ghost">Already registered? Organiser sign in</Link>
    <Link to="/auth" className="mt-3 block text-sm text-muted-foreground">Student registration & sign in</Link>
  </div></main>;
}