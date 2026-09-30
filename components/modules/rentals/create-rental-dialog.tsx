"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createRental, getAvailableItems } from "@/server/actions/rentals";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useGroszInput } from "@/lib/hooks/use-grosz-input";
import { calculateRentalPrice } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import type { RateUnit } from "@/types/items";
import { RATE_UNIT_LABELS } from "@/types/items";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface AvailableItem {
  id: string;
  name: string;
  identifier: string;
  rate: number;
  rateUnit: string;
}

export function CreateRentalDialog() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const price = useGroszInput();
  const [availableItems, setAvailableItems] = useState<AvailableItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [useCustomPrice, setUseCustomPrice] = useState(false);

  useEffect(() => {
    if (open) {
      getAvailableItems().then(setAvailableItems);
      queueMicrotask(() => {
        setSelectedItemId("");
        setStartDate("");
        setEndDate("");
        setUseCustomPrice(false);
        price.reset();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectedItem = availableItems.find((i) => i.id === selectedItemId);
  const calculatedPrice =
    selectedItem && startDate && endDate
      ? (() => {
          const s = new Date(startDate);
          const e = new Date(endDate);
          return e > s
            ? calculateRentalPrice(s, e, selectedItem.rate, selectedItem.rateUnit as RateUnit)
            : 0;
        })()
      : 0;

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      return (await createRental(formData)) ?? null;
    },
    null
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    else if (state?.success) {
      toast.success("Wypożyczenie zostało utworzone");
      formRef.current?.reset();
      queueMicrotask(() => { setOpen(false); price.reset(); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus data-icon="inline-start" />Nowe wypożyczenie</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nowe wypożyczenie</DialogTitle>
          <DialogDescription>Utwórz nowe wypożyczenie zasobu</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="itemId">Zasób</Label>
            <select id="itemId" name="itemId" required className={selectClassName} value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)}>
              <option value="">Wybierz zasób...</option>
              {availableItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.identifier}) — {formatCurrency(item.rate)} / {RATE_UNIT_LABELS[item.rateUnit as RateUnit]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="customerName">Imię i nazwisko klienta</Label>
            <Input id="customerName" name="customerName" required placeholder="Jan Kowalski" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="customerPhone">Telefon</Label>
            <Input id="customerPhone" name="customerPhone" required placeholder="600 123 456" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="customerIdentifier">Identyfikator (PESEL/NIP)</Label>
            <Input id="customerIdentifier" name="customerIdentifier" required placeholder="12345678901" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startDate">Data rozpoczęcia</Label>
              <Input id="startDate" name="startDate" type="datetime-local" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="endDate">Data zakończenia</Label>
              <Input id="endDate" name="endDate" type="datetime-local" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          {calculatedPrice > 0 && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <span className="text-muted-foreground">Wyliczona cena: </span>
              <span className="font-semibold">{formatCurrency(calculatedPrice)}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="useCustomPrice" checked={useCustomPrice} onChange={(e) => { setUseCustomPrice(e.target.checked); if (!e.target.checked) price.reset(); }} className="rounded" />
            <Label htmlFor="useCustomPrice" className="text-sm font-normal">Nadpisz cenę (indywidualne ustalenia)</Label>
          </div>
          {useCustomPrice && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="priceOverrideDisplay">Własna cena (PLN)</Label>
              <input type="hidden" name="totalPriceOverride" value={price.groszValue} />
              <Input id="priceOverrideDisplay" type="text" inputMode="numeric" placeholder="0.00" value={price.displayValue} onChange={price.handleChange} />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Anuluj</Button>
            <Button type="submit" disabled={pending}>{pending ? "Tworzenie..." : "Utwórz wypożyczenie"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
