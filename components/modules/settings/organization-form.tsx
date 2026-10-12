"use client";

import { useActionState, useEffect } from "react";
import { updateOrganization } from "@/server/actions/settings";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OrganizationFormProps {
  name: string;
  nip: string | null;
}

export function OrganizationForm({ name, nip }: OrganizationFormProps) {
  const [state, formAction, pending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      const result = await updateOrganization(formData);
      return result ?? null;
    },
    null
  );

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    } else if (state?.success) {
      toast.success("Dane organizacji zostały zaktualizowane");
    }
  }, [state]);

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="text-lg font-semibold tracking-tight">Organizacja</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Zarządzaj danymi swojej organizacji
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-4 max-w-md">
        <div className="flex flex-col gap-2">
          <Label htmlFor="org-name">Nazwa organizacji</Label>
          <Input
            id="org-name"
            name="name"
            required
            defaultValue={name}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="org-nip">NIP</Label>
          <Input
            id="org-nip"
            name="nip"
            defaultValue={nip ?? ""}
            placeholder="Opcjonalnie"
          />
        </div>

        <Button type="submit" disabled={pending} className="w-fit">
          {pending ? "Zapisywanie..." : "Zapisz zmiany"}
        </Button>
      </form>
    </div>
  );
}
