"use client";

import { useState, useActionState, useEffect } from "react";
import { changeUserPasswordByAdmin } from "@/server/actions/admin";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound } from "lucide-react";

export function ChangeUserPasswordDialog({
  userId,
  userEmail,
  userFullName,
}: {
  userId: string;
  userEmail: string;
  userFullName: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      const result = await changeUserPasswordByAdmin(formData);
      return result ?? null;
    },
    null
  );

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    } else if (state?.success) {
      toast.success("Hasło użytkownika zostało pomyślnie zmienione");
      queueMicrotask(() => setOpen(false));
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Zmień hasło">
          <KeyRound className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Zmień hasło użytkownika</DialogTitle>
          <DialogDescription>
            Ustaw nowe hasło dla <strong>{userFullName}</strong> ({userEmail}).
            <br />
            <span className="text-xs text-muted-foreground mt-1 block">
              Ze względów bezpieczeństwa obecne hasło nie jest dostępne do odczytu.
            </span>
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <input type="hidden" name="userId" value={userId} />

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nowe hasło (min. 8 znaków) *</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              minLength={8}
              placeholder="Wprowadź nowe hasło"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Zapisywanie..." : "Zmień hasło"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
