"use client";

import { useState, useActionState, useEffect } from "react";
import { deleteTenantByAdmin } from "@/server/actions/admin";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

export function DeleteTenantDialog({
  tenantId,
  tenantName,
  userCount,
}: {
  tenantId: string;
  tenantName: string;
  userCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null) => {
      const result = await deleteTenantByAdmin(tenantId);
      return result ?? null;
    },
    null
  );

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    } else if (state?.success) {
      toast.success("Wypożyczalnia została pomyślnie usunięta");
      queueMicrotask(() => setOpen(false));
    }
  }, [state]);

  const isConfirmed = confirmName.trim().toLowerCase() === tenantName.trim().toLowerCase();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 h-8 gap-1.5 text-xs"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Usuń firmę
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">Usuń wypożyczalnię</DialogTitle>
          <DialogDescription className="space-y-2">
            <span>
              Czy na pewno chcesz bezpowrotnie usunąć wypożyczalnię <strong>{tenantName}</strong>?
            </span>
            <span className="block text-xs bg-destructive/10 text-destructive p-2 rounded-md font-medium">
              Uwaga! Zostaną bezpowrotnie usunięte wszystkie zasoby, wypożyczenia, historia płatności oraz {userCount} powiązanych kont użytkowników.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <p className="text-xs text-muted-foreground">
            Wpisz nazwę wypożyczalni <strong>{tenantName}</strong>, aby potwierdzić:
          </p>
          <input
            type="text"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={tenantName}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Anuluj
          </Button>
          <form action={action}>
            <Button
              type="submit"
              variant="destructive"
              disabled={pending || !isConfirmed}
            >
              {pending ? "Usuwanie..." : "Potwierdź i usuń"}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
