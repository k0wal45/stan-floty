"use client";

import { useState, useActionState, useEffect } from "react";
import { updateUserRoleByAdmin } from "@/server/actions/admin";
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
import { Label } from "@/components/ui/label";
import { ShieldAlert } from "lucide-react";
import type { UserRole } from "@/types/auth";

export function ChangeUserRoleDialog({
  userId,
  userFullName,
  currentRole,
}: {
  userId: string;
  userFullName: string;
  currentRole: UserRole;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) => {
      const result = await updateUserRoleByAdmin(formData);
      return result ?? null;
    },
    null
  );

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    } else if (state?.success) {
      toast.success("Rola użytkownika została zaktualizowana");
      queueMicrotask(() => setOpen(false));
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Zmień rolę">
          <ShieldAlert className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Zmień rolę użytkownika</DialogTitle>
          <DialogDescription>
            Zmień uprawnienia dla użytkownika <strong>{userFullName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <input type="hidden" name="userId" value={userId} />

          <div className="space-y-2">
            <Label htmlFor="role">Nowa rola w systemie</Label>
            <select
              id="role"
              name="role"
              defaultValue={currentRole}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="STAFF">Pracownik (STAFF)</option>
              <option value="MANAGER">Menedżer (MANAGER)</option>
              <option value="OWNER">Właściciel (OWNER)</option>
              <option value="ADMIN">Administrator (ADMIN)</option>
            </select>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Zapisywanie..." : "Zapisz rolę"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
