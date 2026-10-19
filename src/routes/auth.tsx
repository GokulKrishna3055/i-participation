import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/lib/supabase-tab";
import { rollToEmail, useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/PasswordField";
import { isStrongPassword, passwordError } from "@/lib/password-rules";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { signInPortal } from "@/lib/portal-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Enter the Crypt — i++26" },
      { name: "description", content: "Register or sign in to i++26 with your roll number." },
      { property: "og:title", content: "Enter the Crypt — i++26" },
      { property: "og:description", content: "Register with your roll number to earn event credits." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => {
    const r = s["redirect"];
    return typeof r === "string" && r.startsWith("/") && !r.startsWith("//") ? { redirect: r } : {};
  },
  component: AuthPage,
});

const regSchema = z.object({
  roll: z.string().trim().min(3, "Roll number too short").max(20).regex(/^[A-Za-z0-9]+$/, "Letters and numbers only"),
  name: z.string().trim().min(2, "Enter your name").max(80),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit phone number"),
  email: z.string().trim().email("Enter a valid email").max(120),
  dept: z.string().trim().min(2, "Enter your department").max(60),
  year: z.enum(["1", "2", "3", "4", "5"], { message: "Select your year" }),
  password: z.string().refine(isStrongPassword, (p) => ({ message: `Password needs: ${passwordError(p)}` })),
});

function AuthPage() {
  const { user, loading, isAdmin, isOrganiser } = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || busy || !user) return;
    if (isAdmin) navigate({ to: "/admin", replace: true });
    else if (isOrganiser) navigate({ to: "/organiser-login", replace: true });
    else navigate({ to: (redirect && !redirect.startsWith("/admin") && !redirect.startsWith("/organiser") ? redirect : "/dashboard") as "/dashboard" });
  }, [user, loading, busy, isAdmin, isOrganiser, redirect, navigate]);

  async function onLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    try { await signInPortal("student", rollToEmail(String(f.get("roll"))), String(f.get("password"))); }
    catch (error) { toast.error((error as Error).message); }
    finally { setBusy(false); }
  }

  async function onRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const parsed = regSchema.safeParse({ roll: f.get("roll"), name: f.get("name"), phone: f.get("phone"), email: f.get("email"), dept: f.get("dept") ?? "", year: f.get("year"), password: f.get("password") });
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Invalid input"); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: rollToEmail(parsed.data.roll),
      password: parsed.data.password,
      options: { data: { roll_number: parsed.data.roll.toUpperCase(), full_name: parsed.data.name, department: parsed.data.dept, phone: parsed.data.phone, contact_email: parsed.data.email.toLowerCase(), year: parsed.data.year, account_type: "student" } },
    });
    setBusy(false);
    if (error) toast.error(error.message.includes("registered") ? "This roll number is already registered" : error.message);
    else toast.success("Welcome to the night!");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 pt-24 pb-12">
      <div className="w-full max-w-md glass rounded-3xl p-8 glow-ghost">
        <h1 className="text-center font-display text-5xl text-primary text-glow">Enter the Crypt</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Your roll number is your key.</p>
        <Tabs defaultValue="register" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="register">Register</TabsTrigger>
            <TabsTrigger value="login">Sign in</TabsTrigger>
          </TabsList>
          <TabsContent value="register">
            <form onSubmit={onRegister} className="mt-4 space-y-4">
              <div><Label htmlFor="r-name">Name</Label><Input id="r-name" name="name" required /></div>
              <div><Label htmlFor="r-roll">Roll number</Label><Input id="r-roll" name="roll" required /></div>
              <div><Label htmlFor="r-phone">Phone number</Label><Input id="r-phone" name="phone" type="tel" inputMode="numeric" maxLength={10} required /></div>
              <div><Label htmlFor="r-email">Email</Label><Input id="r-email" name="email" type="email" required /></div>
              <div><Label htmlFor="r-dept">Department</Label><Input id="r-dept" name="dept" required /></div>
              <div><Label htmlFor="r-year">Year</Label><select id="r-year" name="year" required defaultValue="" className="h-9 w-full rounded-md border bg-background px-2 text-sm"><option value="" disabled>Select year</option><option value="1">1st year</option><option value="2">2nd year</option><option value="3">3rd year</option><option value="4">4th year</option><option value="5">5th year</option></select></div>
              <PasswordField id="r-pw" />
              <Button type="submit" className="w-full rounded-full" disabled={busy}>Register</Button>
            </form>
          </TabsContent>
          <TabsContent value="login">
            <form onSubmit={onLogin} className="mt-4 space-y-4">
              <div><Label htmlFor="l-roll">Roll number</Label><Input id="l-roll" name="roll" required /></div>
              <div><Label htmlFor="l-pw">Password</Label><Input id="l-pw" name="password" type="password" required /></div>
              <Button type="submit" className="w-full rounded-full" disabled={busy}>Sign in</Button>
            </form>
          </TabsContent>
        </Tabs>
        <Link to="/organiser-login" className="mt-5 block text-center text-sm text-ghost">Organiser login</Link>
      </div>
    </main>
  );
}
