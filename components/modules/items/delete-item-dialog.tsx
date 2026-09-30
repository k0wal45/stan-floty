"use client";

import { useActionState, useEffect } from "react";
import { deleteItem } from "@/server/actions/items";
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
import { ItemRow } from "@/types/items";

interface DeleteItemDialogProps {
  item: ItemRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteItemDialog({ item, open, onOpenChange }: DeleteItemDialogProps) {
  const deleteItemWithId = deleteItem.bind(null, item.id);

  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null) => {
      const result = await deleteItemWithId();
      return result ?? null;
    },
    null
  );

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    } else if (state?.success) {
      toast.success("Zasób został usunięty");
      queueMicrotask(() => onOpenChange(false));
    }
  }, [state, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Usuń zasób</DialogTitle>
          <DialogDescription>
            Czy na pewno chcesz usunąć zasób <strong>{item.name}</strong>? Ta operacja jest nieodwracalna. 
            Jeśli zasób posiada powiązaną historię wypożyczeń, usunięcie może się nie powieść.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Usuwanie..." : "Usuń zasób"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}