import { describe, expect, it } from "vitest";
import { participationCredits, canManageEvent, canRegisterForEvent, canAssignOrganiser } from "@/lib/participation-rules";
describe("participation rules", () => {
  it("tech participation is exactly 20 credits", () => expect(participationCredits("tech")).toBe(20));
  it("non-tech participation is exactly 15 credits", () => expect(participationCredits("non_tech")).toBe(15));
  it("an assigned organiser can manage their event", () => expect(canManageEvent(false, "organiser-a", "organiser-a")).toBe(true));
  it("another organiser cannot manage the event", () => expect(canManageEvent(false, "organiser-a", "organiser-b")).toBe(false));
  it("an unassigned student cannot manage the event", () => expect(canManageEvent(false, undefined, "student")).toBe(false));
  it("an organiser cannot be assigned a second event", () => expect(canAssignOrganiser("sequel", "brainbid")).toBe(false));
  it("reassigning the same event is permitted", () => expect(canAssignOrganiser("sequel", "sequel")).toBe(true));
  it("an unassigned organiser can receive their first event", () => expect(canAssignOrganiser(undefined, "sequel")).toBe(true));
  it("organisers cannot register for events", () => expect(canRegisterForEvent(false, true)).toBe(false));
  it("students can register for events", () => expect(canRegisterForEvent(false, false)).toBe(true));
});