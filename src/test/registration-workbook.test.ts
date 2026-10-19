import { describe, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";
vi.mock("@/lib/supabase-tab", () => ({ supabase: { rpc: vi.fn() } }));
vi.mock("xlsx", async (original) => ({ ...await original<typeof import("xlsx")>(), writeFile: vi.fn() }));
import { buildRegistrationWorkbook, exportAllExcel, type RegistrationSnapshot } from "@/lib/excel-export";
import { supabase } from "@/lib/supabase-tab";

const a = { full_name: "Student A", roll_number: "001", phone: "9876543210", contact_email: "a@example.test", department: "CSE", year: "2" };
const b = { ...a, full_name: "Student B", roll_number: "002" };
const snapshot: RegistrationSnapshot = { students: [a, b], events: [
  { id: "sequel", title: "SEQUEL", registrations: [{ ...a, team_code: "SEQ-001" }] },
  { id: "acm", title: "ACM", registrations: [{ ...a, team_code: "ACM-002" }] },
  { id: "empty", title: "BRAINBID", registrations: [] },
] };
const rows = (wb: XLSX.WorkBook, name: string) => {
  const sheet = wb.Sheets[name];
  if (!sheet) throw new Error(`Missing sheet ${name}`);
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
};

describe("single registration workbook", () => {
  it("includes every signup even without event participation", () => {
    const wb = buildRegistrationWorkbook(snapshot);
    expect(rows(wb, "Overall registration").map(r => r["Roll Number"])).toEqual(["001", "002"]);
  });
  it("keeps a multi-event student once in overall and their team distinct per event", () => {
    const wb = buildRegistrationWorkbook(snapshot);
    expect(rows(wb, "Overall registration").filter(r => r["Roll Number"] === "001")).toHaveLength(1);
    expect(rows(wb, "SEQUEL")[0]?.["Team ID"]).toBe("SEQ-001");
    expect(rows(wb, "ACM")[0]?.["Team ID"]).toBe("ACM-002");
  });
  it("includes a sheet for every event including events with no registrations", () => {
    const wb = buildRegistrationWorkbook(snapshot);
    expect(wb.SheetNames).toEqual(["Overall registration", "SEQUEL", "ACM", "BRAINBID"]);
    expect(rows(wb, "BRAINBID")).toEqual([]);
  });
  it("does not export events absent from the authorised snapshot", () => {
    const wb = buildRegistrationWorkbook({ ...snapshot, events: snapshot.events.slice(0, 1) });
    expect(wb.SheetNames).toEqual(["Overall registration", "SEQUEL"]);
  });
  it("uses one snapshot request and writes exactly one file", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: snapshot, error: null } as never);
    const write = vi.mocked(XLSX.writeFile);
    await exportAllExcel();
    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith("registration_workbook");
    expect(write).toHaveBeenCalledTimes(1);
    expect(write.mock.calls[0]?.[0].SheetNames).toHaveLength(4);
  });
});