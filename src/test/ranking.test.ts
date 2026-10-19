import { describe, it, expect } from "vitest";
import { rankRows } from "@/lib/leaderboard";

describe("ranking", () => {
  it("tied scores share the same rank", () => {
    const r = rankRows([{ s: 30 }, { s: 50 }, { s: 50 }, { s: 10 }], (x) => x.s);
    expect(r.map((x) => x.rank)).toEqual([1, 1, 3, 4]);
  });
});
