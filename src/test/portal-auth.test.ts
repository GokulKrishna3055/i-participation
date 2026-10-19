import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ signInWithPassword: vi.fn(), signOut: vi.fn(), single: vi.fn(), rpc: vi.fn() }));
vi.mock("@/lib/supabase-tab", () => ({ supabase: { auth: mocks, rpc: mocks.rpc, from: () => ({ select: () => ({ eq: () => ({ single: mocks.single }) }) }) } }));
import { accountPortal, signInPortal } from "@/lib/portal-auth";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.signInWithPassword.mockResolvedValue({ data: { user: { id: "organiser-id" } }, error: null });
  mocks.single.mockResolvedValue({ data: { account_type: "organiser" }, error: null });
  mocks.rpc.mockResolvedValue({ data: false, error: null });
});
describe("separate sign-in portals", () => {
  it("keeps an unassigned organiser signed in without treating them as a student", async () => {
    expect(accountPortal("organiser", false)).toBe("organiser");
    await expect(signInPortal("organiser", "roll@ipp26.app", "test-password")).resolves.toEqual({ id: "organiser-id" });
    expect(mocks.signOut).not.toHaveBeenCalled();
  });
  it("rejects a student at organiser sign-in without signing out other devices", async () => {
    mocks.single.mockResolvedValue({ data: { account_type: "student" }, error: null });
    await expect(signInPortal("organiser", "roll@ipp26.app", "test-password")).rejects.toThrow("not a organiser account");
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
  it("rejects organiser accounts at student sign-in", async () => {
    await expect(signInPortal("student", "roll@ipp26.app", "test-password")).rejects.toThrow("not a student account");
  });
  it("rejects admin accounts at organiser sign-in", async () => {
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    await expect(signInPortal("organiser", "roll@ipp26.app", "test-password")).rejects.toThrow("not a organiser account");
  });
});