"use client";

import { useActionState, useEffect, useState } from "react";
import { createMember } from "@/server/actions/settings";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { MemberRow, type TeamMemberData } from "./member-row";

const selectCls =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface TeamMembersProps {
  members: TeamMemberData[];
  currentUserId: string;
}

export function TeamMembers({ members, currentUserId }: TeamMembersProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [state, action, pending] = useActionState(
    async (
      _prev: { error?: string; success?: boolean } | null,
      formData: FormData
    ) => {
      const result = await createMember(formData);
      return result ?? null;
    },
    null
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    else if (state?.success) {
      toast.success("Członek zespołu został dodany");
      queueMicrotask(() => setDialogOpen(false));
    }
  }, [state]);

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Członkowie zespołu</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Zarządzaj pracownikami w organizacji
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Dodaj
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dodaj członka zespołu</DialogTitle>
              <DialogDescription>
                Utwórz konto dla nowego pracownika w Twojej organizacji.
              </DialogDescription>
            </DialogHeader>
            <CreateMemberForm action={action} pending={pending} onCancel={() => setDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="mt-6 divide-y rounded-lg border">
        {members.map((m) => (
          <MemberRow key={m.id} member={m} isSelf={m.id === currentUserId} />
        ))}
      </div>
    </div>
  );
}

function CreateMemberForm({
  action,
  pending,
  onCancel,
}: {
  action: (formData: FormData) => void;
  pending: boolean;
  onCancel: () => void;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="member-fullName">Imię i nazwisko</Label>
        <Input id="member-fullName" name="fullName" required placeholder="Jan Kowalski" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="member-email">Adres e-mail</Label>
        <Input id="member-email" name="email" type="email" required placeholder="jan@firma.pl" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="member-password">Hasło tymczasowe</Label>
        <Input id="member-password" name="password" type="text" required minLength={8} placeholder="Min. 8 znaków" />
        <p className="text-xs text-muted-foreground">
          Podaj hasło, które pracownik otrzyma do pierwszego logowania.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="member-role">Rola</Label>
        <select id="member-role" name="role" defaultValue="STAFF" className={selectCls}>
          <option value="STAFF">Pracownik</option>
          <option value="MANAGER">Menedżer</option>
        </select>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>Anuluj</Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Dodawanie..." : "Dodaj członka"}
        </Button>
      </DialogFooter>
    </form>
  );
}
