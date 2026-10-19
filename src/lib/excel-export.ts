import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase-tab";

type Person = { full_name: string; roll_number: string; phone: string | null; contact_email: string | null; department: string | null; year: string | null };
type Row = Person & { team_code: string | null };
export type RegistrationSnapshot = { students: Person[]; events: { id: string; title: string; registrations: Row[] }[] };

const overall = (rows: Person[]) => rows.map((r, i) => ({ "S.No": i + 1, Name: r.full_name, "Roll Number": r.roll_number, "Phone Number": r.phone ?? "", Email: r.contact_email ?? "", Department: r.department ?? "", Year: r.year ?? "" }));
const teams = (rows: Row[]) => rows.map((r) => ({ "Team ID": r.team_code ?? "Individual", Name: r.full_name, "Roll Number": r.roll_number, "Phone Number": r.phone ?? "", Email: r.contact_email ?? "", Department: r.department ?? "", Year: r.year ?? "" }));

export function buildRegistrationWorkbook(snapshot: RegistrationSnapshot) {
  const sheets: [string, object[]][] = [["Overall registration", overall(snapshot.students)], ...snapshot.events.map(ev => [ev.title, teams(ev.registrations)] as [string, object[]])];
  const wb = XLSX.utils.book_new();
  const used = new Set<string>();
  for (const [raw, rows] of sheets) {
    const base = raw.replace(/[\\/?*[\]:]/g, "").replace(/^'+|'+$/g, "").slice(0, 31) || "Event";
    let name = base;
    let suffix = 1;
    while (used.has(name.toLowerCase())) { const tail = ` (${suffix++})`; name = base.slice(0, 31 - tail.length) + tail; }
    used.add(name.toLowerCase());
    const header = used.size === 1 ? ["S.No", "Name", "Roll Number", "Phone Number", "Email", "Department", "Year"] : ["Team ID", "Name", "Roll Number", "Phone Number", "Email", "Department", "Year"];
    const sheet = XLSX.utils.json_to_sheet(rows, { header });
    sheet["!cols"] = header.map(h => ({ wch: h === "Email" ? 32 : h === "Name" ? 28 : 20 }));
    XLSX.utils.book_append_sheet(wb, sheet, name);
  }
  return wb;
}

export async function exportAllExcel() {
  const { data, error } = await supabase.rpc("registration_workbook");
  if (error) throw error;
  const snapshot = data as unknown as RegistrationSnapshot;
  if (!snapshot || !Array.isArray(snapshot.students) || !Array.isArray(snapshot.events)) throw new Error("Unable to load registrations");
  XLSX.writeFile(buildRegistrationWorkbook(snapshot), "ipp26_all_registrations.xlsx");
}
