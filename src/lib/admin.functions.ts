import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { canAssignOrganiser } from "@/lib/participation-rules";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const setAdminRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ userId: z.string().uuid(), admin: z.boolean() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId && !data.admin) throw new Error("You can't remove your own admin access");
    if (data.admin) throw new Error("Only one admin account is allowed");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.admin) {
      const { error } = await supabaseAdmin.from("user_roles").upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", "admin");
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ userId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("You can't delete yourself");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ userId: z.string().uuid(), password: z.string().min(6).max(72) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, { password: data.password });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const assignEventOrganiser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ eventId: z.string().uuid(), rollNumber: z.string().trim().min(1).max(50) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { data: profile, error: lookupError } = await context.supabase.from("profiles").select("id,full_name,account_type").ilike("roll_number", data.rollNumber.replace(/[^a-zA-Z0-9]/g, "")).single();
    if (lookupError || !profile) throw new Error("No account found for that roll number. Ask the organiser to register first.");
    if (profile.account_type !== "organiser") throw new Error("This roll number is not a registered organiser. They must register on the organiser page first.");
    const { data: existing, error: assignmentError } = await context.supabase.from("event_organisers").select("event_id").eq("user_id", profile.id).maybeSingle();
    if (assignmentError) throw new Error(assignmentError.message);
    if (!canAssignOrganiser(existing?.event_id, data.eventId)) throw new Error("This organiser already has an event. Each organiser can manage only one event.");
    const { error } = await context.supabase.from("event_organisers").upsert({ event_id: data.eventId, user_id: profile.id, assigned_at: new Date().toISOString() }, { onConflict: "event_id" });
    if (error) throw new Error(error.code === "23505" ? "This organiser already has an event. Each organiser can manage only one event." : error.message);
    return { name: profile.full_name };
  });
