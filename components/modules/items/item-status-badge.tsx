import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/types/items";
import type { ItemStatus } from "@/types/items";

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  const info = STATUS_LABELS[status];
  return (
    <Badge variant={info.variant} className="shrink-0">
      {info.label}
    </Badge>
  );
}