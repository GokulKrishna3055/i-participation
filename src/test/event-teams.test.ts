import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc, from, select, eq, order } = vi.hoisted(() => ({
  rpc: vi.fn(), from: vi.fn(), select: vi.fn(), eq: vi.fn(), order: vi.fn(),
}));
vi.mock("@/lib/supabase-tab", () => ({ supabase: { rpc, from } }));
import { loadEventTeams } from "@/lib/event-teams";

describe("authorised team member lookup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    from.mockReturnValue({ select });
    select.mockReturnValue({ eq });
    eq.mockReturnValue({ order });
    order.mockResolvedValue({ data: [{ id: "team-1", team_code: "SEQ-002", seq: 2 }], error: null });
    rpc.mockResolvedValue({ data: { events: [
      { id: "sequel", registrations: [
        { team_code: "SEQ-002", full_name: "Student A", roll_number: "001" },
        { team_code: "SEQ-002", full_name: "Student B", roll_number: "002" },
        { team_code: "SEQ-001", full_name: "Student C", roll_number: "003" },
      ] },
      { id: "other-event", registrations: [{ team_code: "SEQ-002", full_name: "Other", roll_number: "004" }] },
    ] }, error: null });
  });
  it("resolves both members without a restricted profiles join", async () => {
    const teams = await loadEventTeams("sequel");
    expect(teams[0]?.members).toEqual([
      { full_name: "Student A", roll_number: "001" },
      { full_name: "Student B", roll_number: "002" },
    ]);
    expect(select).toHaveBeenCalledWith("id,team_code,seq");
    expect(rpc).toHaveBeenCalledWith("registration_workbook");
  });
  it("does not treat a denied member lookup as a successful empty roster", async () => {
    rpc.mockResolvedValue({ data: null, error: new Error("Access denied") });
    await expect(loadEventTeams("sequel")).rejects.toThrow("Access denied");
  });
});
