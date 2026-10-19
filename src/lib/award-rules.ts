export function canOpenOrganiserArea(roles: string[]) {
  return roles.includes("admin");
}