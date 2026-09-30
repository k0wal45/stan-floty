export type ItemStatus = "AVAILABLE" | "RENTED" | "MAINTENANCE";
export type RateUnit = "HOUR" | "DAY" | "WEEK" | "MONTH";

export const RATE_UNIT_LABELS: Record<RateUnit, string> = {
  HOUR: "godzina",
  DAY: "doba",
  WEEK: "tydzień",
  MONTH: "miesiąc",
};

export const RATE_UNIT_OPTIONS: { value: RateUnit; label: string }[] = [
  { value: "HOUR", label: RATE_UNIT_LABELS.HOUR },
  { value: "DAY", label: RATE_UNIT_LABELS.DAY },
  { value: "WEEK", label: RATE_UNIT_LABELS.WEEK },
  { value: "MONTH", label: RATE_UNIT_LABELS.MONTH },
];

export const STATUS_LABELS: Record<
  ItemStatus,
  { label: string; variant: "success" | "default" | "warning" }
> = {
  AVAILABLE: { label: "Dostępny", variant: "success" },
  RENTED: { label: "Wypożyczony", variant: "default" },
  MAINTENANCE: { label: "Serwis", variant: "warning" },
};

export interface ItemRow {
  id: string;
  tenantId: string;
  name: string;
  category: string;
  identifier: string;
  rate: number;
  rateUnit: RateUnit;
  status: ItemStatus;
  imageUrl: string | null;
  gallery: unknown;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}
