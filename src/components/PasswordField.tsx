import { useState } from "react";
import { Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PASSWORD_RULES } from "@/lib/password-rules";

export function PasswordField({ id, name = "password" }: { id: string; name?: string }) {
  const [value, setValue] = useState("");
  return <div>
    <Label htmlFor={id}>Password</Label>
    <Input id={id} name={name} type="password" required autoComplete="new-password" value={value} onChange={(e) => setValue(e.target.value)} aria-describedby={`${id}-rules`} />
    <ul id={`${id}-rules`} className="mt-2 space-y-1 text-xs">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(value);
        return <li key={r.id} className={`flex items-center gap-1.5 ${ok ? "text-ghost" : "text-muted-foreground"}`}>
          {ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}{r.label}
        </li>;
      })}
    </ul>
  </div>;
}
