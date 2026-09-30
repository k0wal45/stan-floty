export { cn } from "cn";

/** Format integer grosz value as PLN string, e.g. 15000 → "150.00 PLN" */
export function formatCurrency(grosz: number): string {
  return `${(grosz / 100).toFixed(2)} PLN`;
}
