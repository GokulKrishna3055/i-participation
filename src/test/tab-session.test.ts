import { describe, expect, it } from "vitest";
import { createTabSession } from "@/lib/tab-session";

describe("independent tab sessions", () => {
  it("retains the same tab's session after reload", () => {
    const first = createTabSession(sessionStorage, "first");
    first.storage.setItem(first.storageKey, "organiser-session");
    const reload = createTabSession(sessionStorage, "reload");
    expect(reload.storage.getItem(reload.storageKey)).toBe("organiser-session");
    expect(reload.storageKey).not.toBe(first.storageKey);
    sessionStorage.clear();
  });
  it("gives duplicated tabs separate auth channels and independent stored sessions", () => {
    const first = createTabSession(sessionStorage, "original");
    first.storage.setItem(first.storageKey, "student-session");
    const copied = new Map<string, string>();
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) copied.set(key, sessionStorage.getItem(key) ?? "");
    }
    const duplicateStorage = { getItem: (k: string) => copied.get(k) ?? null, setItem: (k: string, v: string) => copied.set(k, v), removeItem: (k: string) => copied.delete(k) } as unknown as Storage;
    const duplicate = createTabSession(duplicateStorage, "duplicate");
    expect(duplicate.storageKey).not.toBe(first.storageKey);
    duplicate.storage.setItem(duplicate.storageKey, "organiser-session");
    expect(first.storage.getItem(first.storageKey)).toBe("student-session");
    duplicate.storage.removeItem(duplicate.storageKey);
    expect(first.storage.getItem(first.storageKey)).toBe("student-session");
    sessionStorage.clear();
  });
});