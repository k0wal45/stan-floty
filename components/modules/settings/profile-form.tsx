"use client";

import { useActionState, useEffect } from "react";
import { updateProfile } from "@/server/actions/settings";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProfileFormProps {
  fullName: string;
  email: string;
}

export function ProfileForm({ fullName, email }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      const result = await updateProfile(formData);
      return result ?? null;
    },
    null
  );

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    } else if (state?.success) {
      toast.success("Profil został zaktualizowany");
    }
  }, [state]);

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">Twoje konto</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Zarządzaj danymi swojego konta
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-4 max-w-md">
        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-email">Adres e-mail</Label>
          <Input
            id="profile-email"
            type="email"
            value={email}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Adres e-mail nie może zostać zmieniony
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="profile-fullName">Imię i nazwisko</Label>
          <Input
            id="profile-fullName"
            name="fullName"
            required
            defaultValue={fullName}
          />
        </div>

        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Zapisywanie..." : "Zapisz zmiany"}
        </Button>
      </form>
    </div>
  );
}
