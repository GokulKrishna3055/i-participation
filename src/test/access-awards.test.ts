import { describe, it, expect } from "vitest";
import { canOpenOrganiserArea } from "@/lib/award-rules";
describe("role-based access", () => {
  it("students cannot open the organiser area", () => expect(canOpenOrganiserArea(["user"])).toBe(false));
  it("organisers can open the organiser area", () => expect(canOpenOrganiserArea(["user", "admin"])).toBe(true));
});