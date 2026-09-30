"use client";

import { useActionState, useEffect, useRef } from "react";
import { updateRental } from "@/server/actions/rentals";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RentalWithPaymentInfo } from "@/types/rentals";
import { useGroszInput } from "@/lib/hooks/use-grosz-input";

interface EditRentalDialogProps {
  rental: RentalWithPaymentInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditRentalDialog({ rental, open, onOpenChange }: EditRentalDialogProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const updateWithId = updateRental.bind(null, rental.id);
  const price = useGroszInput(rental.totalPrice);

  useEffect(() => {
    if (open) queueMicrotask(() => price.reset(rental.totalPrice));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rental.totalPrice]);

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return (await updateWithId(formData)) ?? null;
    },
    null
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    else if (state?.success) {
      toast.success("Wypożyczenie zaktualizowane");
      queueMicrotask(() => onOpenChange(false));
    }
  }, [state, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edytuj wypożyczenie</DialogTitle>
          <DialogDescription>Zmień dane klienta lub cenę wypożyczenia.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`cn-${rental.id}`}>Imię i nazwisko klienta</Label>
            <Input id={`cn-${rental.id}`} name="customerName" required defaultValue={rental.customerName} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`cp-${rental.id}`}>Telefon</Label>
            <Input id={`cp-${rental.id}`} name="customerPhone" required defaultValue={rental.customerPhone} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`ci-${rental.id}`}>Identyfikator (PESEL/NIP)</Label>
            <Input id={`ci-${rental.id}`} name="customerIdentifier" required defaultValue={rental.customerIdentifier} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`tp-${rental.id}`}>Cena całkowita (PLN)</Label>
            <input type="hidden" name="totalPriceOverride" value={price.groszValue} />
            <Input id={`tp-${rental.id}`} type="text" inputMode="numeric" required placeholder="0.00" value={price.displayValue} onChange={price.handleChange} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
            <Button type="submit" disabled={pending}>{pending ? "Zapisywanie..." : "Zapisz zmiany"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
