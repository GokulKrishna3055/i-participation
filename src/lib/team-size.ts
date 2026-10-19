/** Resize the member-code slots to an event's team_max, keeping typed codes. */
export function resizeSlots(codes: string[], max: number): string[] {
  const next = codes.slice(0, max);
  while (next.length < max) next.push("");
  return next;
}

/** Human label for an event's team size rule, e.g. "2–3 members" or "1 member". */
export function teamSizeLabel(min: number, max: number): string {
  if (min === max) return `${min} member${min === 1 ? "" : "s"}`;
  return `${min}–${max} members`;
}
