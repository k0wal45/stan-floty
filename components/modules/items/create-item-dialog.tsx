"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createItem } from "@/server/actions/items";
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
import { RateUnitSelect } from "@/components/ui/rate-unit-select";
import { Plus } from "lucide-react";
import { useGroszInput } from "@/lib/hooks/use-grosz-input";

export function CreateItemDialog() {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { groszValue, displayValue, handleChange, reset } = useGroszInput();

  const [state, formAction, pending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      const result = await createItem(formData);
      return result ?? null;
    },
    null
  );

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    } else if (state?.success) {
      toast.success("Zasób został dodany");
      formRef.current?.reset();
      // ponytail: queueMicrotask avoids setState-in-effect lint rule; upgrade to useEffectEvent when stable
      queueMicrotask(() => {
        setOpen(false);
        reset();
      });
    }
  }, [state, reset]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" />
          Dodaj zasób
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nowy zasób</DialogTitle>
          <DialogDescription>
            Dodaj nowy zasób do swojej floty
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nazwa</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="Toyota Corolla"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="category">Kategoria</Label>
            <Input
              id="category"
              name="category"
              required
              placeholder="Samochody osobowe"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="identifier">
              Identyfikator (VIN / nr rej. / nr seryjny)
            </Label>
            <Input
              id="identifier"
              name="identifier"
              required
              placeholder="WA12345"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="rateDisplay">Stawka (PLN)</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <input type="hidden" name="rate" value={groszValue} />
                <Input
                  id="rateDisplay"
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="0.00"
                  value={displayValue}
                  onChange={handleChange}
                />
              </div>
              <RateUnitSelect />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="image">Zdjęcie zasobu</Label>
            <Input
              id="image"
              name="image"
              type="file"
              accept="image/*"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Dodawanie..." : "Dodaj"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
