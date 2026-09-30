"use client";

import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getRentalPayments } from "@/server/actions/rentals";
import { formatCurrency } from "@/lib/utils";
import { PAYMENT_METHOD_LABELS } from "@/types/rentals";
import type { PaymentRecord } from "@/types/rentals";

interface PaymentHistoryPopoverProps {
  rentalId: string;
  children: React.ReactNode;
}

export function PaymentHistoryPopover({ rentalId, children }: PaymentHistoryPopoverProps) {
  const [open, setOpen] = useState(false);
  const [payments, setPayments] = useState<PaymentRecord[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && payments === null) {
      setLoading(true);
      getRentalPayments(rentalId)
        .then(setPayments)
        .catch(() => setPayments([]))
        .finally(() => setLoading(false));
    }
  }, [open, rentalId, payments]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex flex-col gap-2 p-4">
          <h4 className="font-medium leading-none">Historia płatności</h4>
          <p className="text-sm text-muted-foreground">Ostatnie wpłaty do tego wypożyczenia.</p>
          
          <div className="mt-2 flex flex-col gap-3">
            {loading ? (
              <p className="text-sm text-muted-foreground">Ładowanie...</p>
            ) : payments === null ? null : payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Brak zarejestrowanych płatności.</p>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{formatCurrency(p.amount)}</span>
                    <span className="text-xs text-muted-foreground">{PAYMENT_METHOD_LABELS[p.method]}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat("pl-PL", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    }).format(new Date(p.paidAt))}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}