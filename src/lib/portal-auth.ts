import { supabase } from "@/lib/supabase-tab";

export type Portal = "student" | "organiser" | "admin";
export function accountPortal(accountType: string | null | undefined, admin: boolean): Portal {
  return admin ? "admin" : accountType === "organiser" ? "organiser" : "student";
}

export async function signInPortal(portal: Portal, email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) throw new Error("Wrong roll number or password");
  const [{ data: profile, error: profileError }, { data: admin, error: roleError }] = await Promise.all([
    supabase.from("profiles").select("account_type").eq("id", data.user.id).single(),
    supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" }),
  ]);
  if (profileError || roleError || !profile) {
    await supabase.auth.signOut({ scope: "local" });
    throw new Error("Unable to check your account. Please try signing in again.");
  }
  if (accountPortal(profile.account_type, !!admin) !== portal) {
    await supabase.auth.signOut({ scope: "local" });
    throw new Error(`This is not a ${portal} account. Use your account's own sign-in page.`);
  }
  return data.user;
}