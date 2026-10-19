import { describe, expect, it } from "vitest";
import { resizeSlots, teamSizeLabel } from "@/lib/team-size";

describe("per-event team size slots", () => {
  it("grows to 5 slots for CLUEDO (3–5 members)", () => {
    expect(resizeSlots(["AAA", "BBB"], 5)).toEqual(["AAA", "BBB", "", "", ""]);
  });
  it("shrinks to 2 slots for SEQUEL (1–2 members), dropping extras", () => {
    expect(resizeSlots(["AAA", "BBB", "CCC"], 2)).toEqual(["AAA", "BBB"]);
  });
  it("keeps 3 slots for LOGIC LOCKDOWN and BRAINBID (1–3 members)", () => {
    expect(resizeSlots(["AAA"], 3)).toEqual(["AAA", "", ""]);
  });
});

describe("team size label", () => {
  it("shows ranges for mixed sizes", () => {
    expect(teamSizeLabel(3, 5)).toBe("3–5 members");
    expect(teamSizeLabel(2, 3)).toBe("2–3 members");
  });
  it("shows a single size when min equals max", () => {
    expect(teamSizeLabel(1, 1)).toBe("1 member");
  });
});
