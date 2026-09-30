import type { RentalWithPaymentInfo } from "@/types/rentals";
import { RentalStatusBadge } from "./rental-status-badge";
import { PaymentStatusBadge } from "./payment-status-badge";
import { RentalCardActions } from "./rental-card-actions";
import { PaymentHistoryPopover } from "./payment-history-popover";
import { RentalCardPricing } from "./rental-card-pricing";

interface RentalCardProps {
  rental: RentalWithPaymentInfo;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Warsaw",
  }).format(date);
}

export function RentalCard({ rental }: RentalCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md min-w-[300px]">
      <div className="flex flex-col p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-col gap-0.5">
            <h3 className="font-semibold leading-tight tracking-tight">
              {rental.itemName}
            </h3>
            <span className="text-xs font-mono text-muted-foreground">
              {rental.itemIdentifier}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <PaymentHistoryPopover rentalId={rental.id}>
              <button type="button" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full">
                <PaymentStatusBadge status={rental.paymentStatus} />
              </button>
            </PaymentHistoryPopover>
            <RentalStatusBadge status={rental.status} />
          </div>
        </div>

        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
          <p>
            Klient:{" "}
            <span className="text-foreground font-medium">
              {rental.customerName}
            </span>
          </p>
          <p>Telefon: {rental.customerPhone}</p>
          <p>
            Od: {formatDate(new Date(rental.startDate))} → Do:{" "}
            {formatDate(new Date(rental.endDate))}
          </p>
        </div>

        <RentalCardPricing rental={rental} />
      </div>
      
      <div className="border-t bg-muted/20 p-3">
        <RentalCardActions rental={rental} />
      </div>
    </div>
  );
}


