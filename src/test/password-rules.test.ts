import { describe, it, expect } from "vitest";
import { isStrongPassword } from "@/lib/password-rules";

describe("password rules", () => {
  it("accepts a password meeting every rule", () => expect(isStrongPassword("Gokul@890")).toBe(true));
  it("rejects fewer than 8 characters", () => expect(isStrongPassword("Ab@1xyz")).toBe(false));
  it("rejects missing uppercase", () => expect(isStrongPassword("gokul@890")).toBe(false));
  it("rejects missing lowercase", () => expect(isStrongPassword("GOKUL@890")).toBe(false));
  it("rejects missing number", () => expect(isStrongPassword("Gokul@abc")).toBe(false));
  it("rejects missing special character", () => expect(isStrongPassword("Gokul8901")).toBe(false));
});
