"use client";

import { useState } from "react";
import type { RentalWithPaymentInfo } from "@/types/rentals";
import { formatCurrency } from "@/lib/utils";
import { RATE_UNIT_LABELS } from "@/types/items";
import { calculateBillingUnits } from "@/lib/pricing";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { RecordPaymentDialog } from "./record-payment-dialog";

export function RentalCardPricing({
  rental,
}: {
  rental: RentalWithPaymentInfo;
}) {
  const [showPayment, setShowPayment] = useState(false);
  const balance = rental.totalPrice - rental.totalPaid;
  const units = calculateBillingUnits(
    new Date(rental.startDate),
    new Date(rental.endDate),
    rental.rateUnitSnapshot
  );

  const unitLabels = {
    HOUR: units === 1 ? "godz." : "godz.",
    DAY: units === 1 ? "dzień" : "dni",
    WEEK: units === 1 ? "tydz." : "tyg.",
    MONTH: units === 1 ? "mies." : "mies.",
  };

  const unitText = `${units} ${unitLabels[rental.rateUnitSnapshot]}`;

  return (
    <div className="flex flex-col gap-1.5 mt-4 border-t pt-3">
      <div className="text-2xl font-bold tracking-tight">
        {formatCurrency(rental.totalPrice)}
      </div>
      
      <div className="text-sm">
        <span className="text-muted-foreground">Zapłacono: </span>
        <span className="font-medium">{formatCurrency(rental.totalPaid)}</span>
      </div>

      <div className="flex items-center gap-2 text-sm min-h-[28px]">
        {balance > 0 ? (
          <>
            <span className="text-muted-foreground">Do zapłaty: </span>
            <span className="bg-destructive text-destructive-foreground px-2.5 py-0.5 rounded-full font-semibold">
              {formatCurrency(balance)}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={() => setShowPayment(true)}
            >
              <Plus className="size-3.5 mr-1" />
              Wpłać
            </Button>
          </>
        ) : (
          <span className="text-muted-foreground">Opłacono w całości</span>
        )}
      </div>

      <div className="text-sm text-muted-foreground mt-0.5">
        Stawka: {formatCurrency(rental.rateSnapshot)} /{" "}
        {RATE_UNIT_LABELS[rental.rateUnitSnapshot].toLowerCase()} ({unitText})
      </div>

      <RecordPaymentDialog
        rental={rental}
        open={showPayment}
        onOpenChange={setShowPayment}
      />
    </div>
  );
}

