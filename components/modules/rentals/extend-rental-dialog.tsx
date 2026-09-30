"use client";

import { useActionState, useEffect, useState } from "react";
import { extendRental } from "@/server/actions/rentals";
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
import { calculateBillingUnits } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import { RATE_UNIT_LABELS } from "@/types/items";
import type { RateUnit } from "@/types/items";

interface ExtendRentalDialogProps {
  rental: RentalWithPaymentInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExtendRentalDialog({ rental, open, onOpenChange }: ExtendRentalDialogProps) {
  const extendWithId = extendRental.bind(null, rental.id);
  const [newEndDate, setNewEndDate] = useState("");

  useEffect(() => {
    if (open) queueMicrotask(() => setNewEndDate(""));
  }, [open]);

  const additionalCost =
    newEndDate
      ? (() => {
          const nd = new Date(newEndDate);
          const currentEnd = new Date(rental.endDate);
          if (nd <= currentEnd) return 0;
          const units = calculateBillingUnits(currentEnd, nd, rental.rateUnitSnapshot as RateUnit);
          return units * rental.rateSnapshot;
        })()
      : 0;

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return (await extendWithId(formData)) ?? null;
    },
    null
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    else if (state?.success) {
      toast.success("Wypożyczenie przedłużone");
      queueMicrotask(() => onOpenChange(false));
    }
  }, [state, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Przedłuż wypożyczenie</DialogTitle>
          <DialogDescription>
            Aktualna data zakończenia:{" "}
            {new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Warsaw" }).format(new Date(rental.endDate))}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`ned-${rental.id}`}>Nowa data zakończenia</Label>
            <Input id={`ned-${rental.id}`} name="newEndDate" type="datetime-local" required value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} />
          </div>
          {additionalCost > 0 && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <span className="text-muted-foreground">Dodatkowy koszt: </span>
              <span className="font-semibold">{formatCurrency(additionalCost)}</span>
              <span className="text-muted-foreground"> ({RATE_UNIT_LABELS[rental.rateUnitSnapshot as RateUnit]})</span>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
            <Button type="submit" disabled={pending}>{pending ? "Przedłużanie..." : "Przedłuż"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
