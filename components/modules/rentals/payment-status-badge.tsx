import { Badge } from "@/components/ui/badge";
import { PAYMENT_STATUS_LABELS } from "@/types/rentals";
import type { PaymentStatus } from "@/types/rentals";

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const info = PAYMENT_STATUS_LABELS[status];
  return (
    <Badge variant={info.variant} className="shrink-0">
      {info.label}
    </Badge>
  );
}
