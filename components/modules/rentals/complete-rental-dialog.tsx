"use client";

import { useActionState, useEffect } from "react";
import { completeRental } from "@/server/actions/rentals";
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
import type { RentalWithPaymentInfo } from "@/types/rentals";

interface CompleteRentalDialogProps {
  rental: RentalWithPaymentInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CompleteRentalDialog({ rental, open, onOpenChange }: CompleteRentalDialogProps) {
  const completeWithId = completeRental.bind(null, rental.id);

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null) => {
      return (await completeWithId()) ?? null;
    },
    null
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    else if (state?.success) {
      toast.success("Wypożyczenie zakończone");
      queueMicrotask(() => onOpenChange(false));
    }
  }, [state, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zakończ wypożyczenie</DialogTitle>
          <DialogDescription>
            Czy na pewno chcesz zakończyć wypożyczenie zasobu <strong>{rental.itemName}</strong> dla klienta <strong>{rental.customerName}</strong>?
            Zasób zostanie oznaczony jako dostępny.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
            <Button type="submit" disabled={pending}>{pending ? "Kończenie..." : "Zakończ wypożyczenie"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
