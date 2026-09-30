"use client";

import { useActionState, useEffect } from "react";
import { recordPayment } from "@/server/actions/rentals";
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
import { PAYMENT_METHOD_OPTIONS } from "@/types/rentals";
import { useGroszInput } from "@/lib/hooks/use-grosz-input";
import { formatCurrency } from "@/lib/utils";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface RecordPaymentDialogProps {
  rental: RentalWithPaymentInfo;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordPaymentDialog({ rental, open, onOpenChange }: RecordPaymentDialogProps) {
  const recordWithId = recordPayment.bind(null, rental.id);
  const balance = rental.totalPrice - rental.totalPaid;
  const amount = useGroszInput(balance > 0 ? balance : undefined);

  useEffect(() => {
    if (open) queueMicrotask(() => amount.reset(balance > 0 ? balance : undefined));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, balance]);

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return (await recordWithId(formData)) ?? null;
    },
    null
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    else if (state?.success) {
      toast.success("Płatność zarejestrowana");
      queueMicrotask(() => onOpenChange(false));
    }
  }, [state, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zarejestruj płatność</DialogTitle>
          <DialogDescription>
            Cena: {formatCurrency(rental.totalPrice)} | Zapłacono: {formatCurrency(rental.totalPaid)}
            {balance > 0 && <> | Do zapłaty: <strong>{formatCurrency(balance)}</strong></>}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`pa-${rental.id}`}>Kwota (PLN)</Label>
            <input type="hidden" name="amount" value={amount.groszValue} />
            <Input id={`pa-${rental.id}`} type="text" inputMode="numeric" required placeholder="0.00" value={amount.displayValue} onChange={amount.handleChange} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`pm-${rental.id}`}>Metoda płatności</Label>
            <select id={`pm-${rental.id}`} name="method" required className={selectClassName} defaultValue="CASH">
              {PAYMENT_METHOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
            <Button type="submit" disabled={pending}>{pending ? "Rejestrowanie..." : "Zarejestruj płatność"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
