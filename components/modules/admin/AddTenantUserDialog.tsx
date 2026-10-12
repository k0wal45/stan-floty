"use client";

import { useState, useActionState, useEffect } from "react";
import { createTenantUserByAdmin } from "@/server/actions/admin";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";

export function AddTenantUserDialog({
  tenantId,
  tenantName,
}: {
  tenantId: string;
  tenantName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      const result = await createTenantUserByAdmin(formData);
      return result ?? null;
    },
    null
  );

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    } else if (state?.success) {
      toast.success("Użytkownik został pomyślnie dodany");
      queueMicrotask(() => setOpen(false));
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs">
          <UserPlus className="h-3.5 w-3.5" />
          Dodaj użytkownika
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Dodaj użytkownika</DialogTitle>
          <DialogDescription>
            Dodaj nowe konto do wypożyczalni <strong>{tenantName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <input type="hidden" name="tenantId" value={tenantId} />

          <div className="space-y-2">
            <Label htmlFor="fullName">Imię i nazwisko *</Label>
            <Input id="fullName" name="fullName" required placeholder="Adam Nowak" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Adres e-mail *</Label>
            <Input id="email" name="email" type="email" required placeholder="adam@firma.pl" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Rola w systemie *</Label>
            <select
              id="role"
              name="role"
              defaultValue="STAFF"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="STAFF">Pracownik (STAFF)</option>
              <option value="MANAGER">Menedżer (MANAGER)</option>
              <option value="OWNER">Właściciel (OWNER)</option>
              <option value="ADMIN">Administrator (ADMIN)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Hasło początkowe *</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Min. 8 znaków"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Dodawanie..." : "Dodaj użytkownika"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
