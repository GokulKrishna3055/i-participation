export const FEST_NAME = "i++26";
export const FEST_TAGLINE = "Night of the Infinite Loop";

export type Category = "tech" | "non_tech";

export function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata",
  });
}
