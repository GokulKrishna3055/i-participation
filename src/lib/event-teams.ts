import { supabase } from "@/lib/supabase-tab";
import type { RegistrationSnapshot } from "@/lib/excel-export";

/** Resolve names through the authorised snapshot, not restricted profile joins. */
export async function loadEventTeams(eventId: string) {
  const [teams, workbook] = await Promise.all([
    supabase.from("teams").select("id,team_code,seq").eq("event_id", eventId).order("seq"),
    supabase.rpc("registration_workbook"),
  ]);
  if (teams.error) throw teams.error;
  if (workbook.error) throw workbook.error;
  const snapshot = workbook.data as unknown as RegistrationSnapshot;
  if (!snapshot || !Array.isArray(snapshot.events)) throw new Error("Unable to load team members");
  const members = snapshot.events.find((event) => event.id === eventId)?.registrations ?? [];
  return (teams.data ?? []).map((team) => ({
    ...team,
    members: members.filter((member) => member.team_code === team.team_code).map((member) => ({
      full_name: member.full_name,
      roll_number: member.roll_number,
    })),
  }));
}
