"use client";

import { useState, useActionState, useEffect } from "react";
import { deleteUserByAdmin } from "@/server/actions/admin";
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

export function DeleteUserDialog({
  userId,
  userFullName,
  userEmail,
  isSelf,
}: {
  userId: string;
  userFullName: string;
  userEmail: string;
  isSelf: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null) => {
      const result = await deleteUserByAdmin(userId);
      return result ?? null;
    },
    null
  );

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    } else if (state?.success) {
      toast.success("Użytkownik został usunięty");
      queueMicrotask(() => setOpen(false));
    }
  }, [state]);

  if (isSelf) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
          title="Usuń użytkownika"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Usuń użytkownika</DialogTitle>
          <DialogDescription>
            Czy na pewno chcesz trwale usunąć użytkownika <strong>{userFullName}</strong> ({userEmail})?
            Ta operacja usunie konto również z systemu uwierzytelniania i jest nieodwracalna.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="pt-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Anuluj
          </Button>
          <form action={action}>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Usuwanie..." : "Usuń użytkownika"}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
