import { RATE_UNIT_OPTIONS } from "@/types/items";
import type { RateUnit } from "@/types/items";

const selectClassName =
  "flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface RateUnitSelectProps {
  name?: string;
  defaultValue?: RateUnit;
  id?: string;
  className?: string;
}

export function RateUnitSelect({
  name = "rateUnit",
  defaultValue = "DAY",
  id,
  className,
}: RateUnitSelectProps) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={defaultValue}
      className={className ?? `${selectClassName} w-[110px]`}
    >
      {RATE_UNIT_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}