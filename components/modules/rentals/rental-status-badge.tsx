import { Badge } from "@/components/ui/badge";
import { RENTAL_STATUS_LABELS } from "@/types/rentals";
import type { RentalStatus } from "@/types/rentals";

export function RentalStatusBadge({ status }: { status: RentalStatus }) {
  const info = RENTAL_STATUS_LABELS[status];
  return (
    <Badge variant={info.variant} className="shrink-0">
      {info.label}
    </Badge>
  );
}
