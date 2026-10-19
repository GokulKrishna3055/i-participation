export const participationCredits = (category: "tech" | "non_tech") => category === "tech" ? 20 : 15;
export function canManageEvent(admin: boolean, assignedUserId: string | undefined, userId: string) {
  return admin || assignedUserId === userId;
}
export const canRegisterForEvent = (admin: boolean, organiser: boolean) => !admin && !organiser;
export const canAssignOrganiser = (existingEventId: string | undefined, eventId: string) => !existingEventId || existingEventId === eventId;