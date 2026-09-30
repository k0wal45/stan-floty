"use client";

import { useActionState, useEffect } from "react";
import { cancelRental } from "@/server/actions/rentals";
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

interface CancelRentalDialogProps {
  rental: RentalWithPaymentInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CancelRentalDialog({ rental, open, onOpenChange }: CancelRentalDialogProps) {
  const cancelWithId = cancelRental.bind(null, rental.id);

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null) => {
      return (await cancelWithId()) ?? null;
    },
    null
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    else if (state?.success) {
      toast.success("Wypożyczenie anulowane");
      queueMicrotask(() => onOpenChange(false));
    }
  }, [state, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Anuluj wypożyczenie</DialogTitle>
          <DialogDescription>
            Czy na pewno chcesz anulować wypożyczenie zasobu <strong>{rental.itemName}</strong>?
            Zasób zostanie oznaczony jako dostępny. Historia płatności zostanie zachowana.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Nie</Button>
            <Button type="submit" variant="destructive" disabled={pending}>{pending ? "Anulowanie..." : "Anuluj wypożyczenie"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
