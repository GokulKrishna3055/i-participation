export const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 && p.length <= 72 },
  { id: "upper", label: "One uppercase letter (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase letter (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { id: "number", label: "One number (0-9)", test: (p: string) => /[0-9]/.test(p) },
  { id: "special", label: "One special character (!@#$…)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

export const isStrongPassword = (p: string) => PASSWORD_RULES.every((r) => r.test(p));
export const passwordError = (p: string) => PASSWORD_RULES.find((r) => !r.test(p))?.label ?? null;
