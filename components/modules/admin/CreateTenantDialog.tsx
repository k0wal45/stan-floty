"use client";

import { useState, useActionState, useEffect } from "react";
import { createTenantByAdmin } from "@/server/actions/admin";
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
import { Plus } from "lucide-react";

export function CreateTenantDialog() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      const result = await createTenantByAdmin(formData);
      return result ?? null;
    },
    null
  );

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    } else if (state?.success) {
      toast.success("Nowa wypożyczalnia została pomyślnie utworzona");
      queueMicrotask(() => setOpen(false));
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Dodaj wypożyczalnię
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nowa wypożyczalnia</DialogTitle>
          <DialogDescription>
            Utwórz nową organizację oraz konto pierwszego właściciela (OWNER).
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Nazwa wypożyczalni *</Label>
            <Input
              id="companyName"
              name="companyName"
              required
              placeholder="np. Auto-Mix Wynajem"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nip">NIP (opcjonalnie)</Label>
            <Input id="nip" name="nip" placeholder="10 cyfr bez kresek" />
          </div>

          <div className="border-t pt-3 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Konto pierwszego właściciela
            </p>

            <div className="space-y-2">
              <Label htmlFor="ownerFullName">Imię i nazwisko właściciela *</Label>
              <Input
                id="ownerFullName"
                name="ownerFullName"
                required
                placeholder="Jan Kowalski"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerEmail">Adres e-mail *</Label>
              <Input
                id="ownerEmail"
                name="ownerEmail"
                type="email"
                required
                placeholder="jan@automix.pl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ownerPassword">Początkowe hasło (min. 8 znaków) *</Label>
              <Input
                id="ownerPassword"
                name="ownerPassword"
                type="password"
                required
                minLength={8}
                placeholder="Hasło dostępowe"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Tworzenie..." : "Utwórz wypożyczalnię"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
