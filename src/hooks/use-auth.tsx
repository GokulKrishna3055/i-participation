import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-tab";
import { accountPortal } from "@/lib/portal-auth";

type Profile = { id: string; roll_number: string; full_name: string; department: string | null; student_code: string; locked_event_id: string | null; account_type: string };
type AuthCtx = { user: User | null; profile: Profile | null; isAdmin: boolean; isOrganiser: boolean; loading: boolean; refresh: () => void };

const Ctx = createContext<AuthCtx>({ user: null, profile: null, isAdmin: false, isOrganiser: false, loading: true, refresh: () => {} });

export const ROLL_DOMAIN = "ipp26.app";
export const rollToEmail = (roll: string) =>
  `${roll.trim().toLowerCase().replace(/[^a-z0-9]/g, "")}@${ROLL_DOMAIN}`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOrganiser, setIsOrganiser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      setLoading(!!session?.user);
      setProfile(null); setIsAdmin(false); setIsOrganiser(false);
      setUser(session?.user ?? null);
    });
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (!data.user) setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setProfile(null); setIsAdmin(false); setIsOrganiser(false); setLoading(false); return; }
    let cancel = false;
    setLoading(true);
    (async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      ]);
      if (cancel) return;
      setProfile(p as Profile | null);
      setIsAdmin(!!r);
      setIsOrganiser(accountPortal(p?.account_type, !!r) === "organiser");
      setLoading(false);
    })();
    return () => { cancel = true; };
  }, [user, tick]);

  return (
    <Ctx.Provider value={{ user, profile, isAdmin, isOrganiser, loading, refresh: () => setTick((t) => t + 1) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
