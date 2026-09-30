import { Image as ImageIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { RATE_UNIT_LABELS } from "@/types/items";
import type { ItemRow, RateUnit } from "@/types/items";
import { ItemStatusBadge } from "./item-status-badge";
import { ItemCardActions } from "./item-card-actions";
import Link from "next/link";

interface ItemCardProps {
  item: ItemRow;
  canManage: boolean;
}

export function ItemCard({ item, canManage }: ItemCardProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
      <Link href={`/przedmioty/${item.id}`} className="aspect-[4/3] w-full overflow-hidden bg-muted block">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="size-10 text-muted-foreground/30" />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <Link href={`/przedmioty/${item.id}`} className="hover:underline hover:text-primary">
            <h3 className="font-semibold leading-tight tracking-tight">
              {item.name}
            </h3>
          </Link>
          <ItemStatusBadge status={item.status} />
        </div>
        <div className="mb-4 mt-auto flex flex-col gap-1 text-sm text-muted-foreground">
          <p>Kategoria: {item.category}</p>
          <p>ID: <span className="font-mono text-xs">{item.identifier}</span></p>
        </div>
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Stawka</span>
            <span className="font-medium">
              {formatCurrency(item.rate)} / {RATE_UNIT_LABELS[item.rateUnit as RateUnit]}
            </span>
          </div>
          {canManage && <ItemCardActions item={item} />}
        </div>
      </div>
    </div>
  );
}