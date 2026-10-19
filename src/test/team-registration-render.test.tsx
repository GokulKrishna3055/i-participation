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
});
