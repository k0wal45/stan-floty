"use client";

import { useActionState, useEffect, useRef } from "react";
import { updateItem } from "@/server/actions/items";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RateUnitSelect } from "@/components/ui/rate-unit-select";
import { ItemRow } from "@/types/items";
import { useGroszInput } from "@/lib/hooks/use-grosz-input";

const statusSelectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface EditItemDialogProps {
  item: ItemRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditItemDialog({ item, open, onOpenChange }: EditItemDialogProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const updateItemWithId = updateItem.bind(null, item.id);
  const { groszValue, displayValue, handleChange, reset } = useGroszInput(item.rate);

  useEffect(() => {
    if (open) {
      // ponytail: queueMicrotask avoids setState-in-effect lint rule; upgrade to useEffectEvent when stable
      queueMicrotask(() => reset(item.rate));
    }
  }, [open, item.rate, reset]);

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      const result = await updateItemWithId(formData);
      return result ?? null;
    },
    null
  );

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    } else if (state?.success) {
      toast.success("Zasób został zaktualizowany");
      queueMicrotask(() => onOpenChange(false));
    }
  }, [state, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edytuj zasób</DialogTitle>
          <DialogDescription>Zmień dane zasobu w swojej flocie.</DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`name-${item.id}`}>Nazwa</Label>
            <Input id={`name-${item.id}`} name="name" required defaultValue={item.name} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`category-${item.id}`}>Kategoria</Label>
            <Input id={`category-${item.id}`} name="category" required defaultValue={item.category} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`identifier-${item.id}`}>Identyfikator</Label>
            <Input id={`identifier-${item.id}`} name="identifier" required defaultValue={item.identifier} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`rateDisplay-${item.id}`}>Stawka (PLN)</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input type="hidden" name="rate" value={groszValue} />
                <Input
                  id={`rateDisplay-${item.id}`}
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="0.00"
                  value={displayValue}
                  onChange={handleChange}
                />
              </div>
              <RateUnitSelect defaultValue={item.rateUnit} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`status-${item.id}`}>Status</Label>
            <select
              id={`status-${item.id}`}
              name="status"
              defaultValue={item.status}
              className={statusSelectClassName}
            >
              <option value="AVAILABLE">Dostępny</option>
              <option value="RENTED">Wypożyczony</option>
              <option value="MAINTENANCE">W serwisie</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor={`image-${item.id}`}>Nowe zdjęcie (opcjonalnie)</Label>
            <Input id={`image-${item.id}`} name="image" type="file" accept="image/*" />
            <p className="text-xs text-muted-foreground">
              Pozostaw to pole puste, jeśli nie chcesz zmieniać aktualnego zdjęcia.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
