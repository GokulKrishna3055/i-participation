import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { useQuery } = vi.hoisted(() => ({ useQuery: vi.fn() }));
vi.mock("@tanstack/react-query", () => ({
  useQuery,
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));
vi.mock("@/lib/supabase-tab", () => ({ supabase: {} }));
vi.mock("@/components/QrScanner", () => ({ QrScanner: () => null }));
import { TeamRegistration } from "@/components/TeamRegistration";

describe("team registration render regression", () => {
  beforeEach(() => vi.resetAllMocks());

  it("does not reference an undeclared team list while queries are pending", () => {
    useQuery.mockReturnValue({ data: undefined });
    expect(() => renderToString(<TeamRegistration eventId="sequel" />)).not.toThrow();
  });

  it("does not reference an undeclared team list after teams load", () => {
    useQuery.mockReturnValueOnce({ data: { team_min: 1, team_max: 2 } });
    useQuery.mockReturnValueOnce({ data: [{
      id: "team-1", team_code: "SEQ-001", seq: 1,
      members: [{ full_name: "Registered student", roll_number: "001" }],
    }] });
    expect(() => renderToString(<TeamRegistration eventId="sequel" />)).not.toThrow();
  });
  it("renders safely when the limits or teams request fails", () => {
    useQuery.mockReturnValue({ data: undefined, error: new Error("Access denied") });
    expect(() => renderToString(<TeamRegistration eventId="sequel" />)).not.toThrow();
  });

  it.each([
    ["cluedo", 3, 5],
    ["logic-lockdown", 1, 3],
    ["brainbid", 1, 3],
    ["sequel", 1, 2],
    ["acm", 2, 3],
  ])("renders loaded limits for %s without undeclared variables", (eventId, team_min, team_max) => {
    useQuery.mockReturnValueOnce({ data: { team_min, team_max } });
    useQuery.mockReturnValueOnce({ data: [] });
    expect(() => renderToString(<TeamRegistration eventId={eventId} />)).not.toThrow();
  });
});
});
