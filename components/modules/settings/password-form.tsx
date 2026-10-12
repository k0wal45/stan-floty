"use client";

import { useActionState, useEffect, useRef } from "react";
import { updatePassword } from "@/server/actions/settings";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      const result = await updatePassword(formData);
      return result ?? null;
    },
    null
  );

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    } else if (state?.success) {
      toast.success("Hasło zostało pomyślnie zmienione");
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">Zmiana hasła</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Zaktualizuj swoje hasło do konta
      </p>

      <form ref={formRef} action={formAction} className="mt-6 flex flex-col gap-4 max-w-md">
        <div className="flex flex-col gap-2">
          <Label htmlFor="password-new">Nowe hasło</Label>
          <Input
            id="password-new"
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Min. 8 znaków"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password-confirm">Potwierdź nowe hasło</Label>
          <Input
            id="password-confirm"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            placeholder="Powtórz nowe hasło"
          />
        </div>

        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Zapisywanie..." : "Zmień hasło"}
        </Button>
      </form>
    </div>
  );
}
