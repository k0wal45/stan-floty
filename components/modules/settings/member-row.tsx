"use client";

import { useActionState, useEffect, useState } from "react";
import { removeMember } from "@/server/actions/settings";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import type { UserRole } from "@/types/auth";

const roleLabel: Record<UserRole, string> = {
  ADMIN: "Administrator",
  OWNER: "Właściciel",
  MANAGER: "Menedżer",
  STAFF: "Pracownik",
};

const roleVariant: Record<UserRole, "default" | "secondary" | "outline" | "destructive"> = {
  ADMIN: "destructive",
  OWNER: "default",
  MANAGER: "secondary",
  STAFF: "outline",
};

export interface TeamMemberData {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: Date;
}

export function MemberRow({ member, isSelf }: { member: TeamMemberData; isSelf: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null) => {
      const result = await removeMember(member.id);
      return result ?? null;
    },
    null
  );

  useEffect(() => {
    if (state?.error) toast.error(state.error);
    else if (state?.success) {
      toast.success("Członek zespołu został usunięty");
      queueMicrotask(() => setOpen(false));
    }
  }, [state]);

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{member.fullName}</span>
          <Badge variant={roleVariant[member.role]}>{roleLabel[member.role]}</Badge>
          {isSelf && <span className="text-xs text-muted-foreground">(Ty)</span>}
        </div>
        <span className="text-xs text-muted-foreground truncate">{member.email}</span>
      </div>
      {!isSelf && member.role !== "OWNER" && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" title="Usuń członka">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Usuń członka zespołu</DialogTitle>
              <DialogDescription>
                Czy na pewno chcesz usunąć <strong>{member.fullName}</strong> ({member.email})
                z organizacji? Ta operacja jest nieodwracalna.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Anuluj</Button>
              <form action={action}>
                <Button type="submit" variant="destructive" disabled={pending}>
                  {pending ? "Usuwanie..." : "Usuń"}
                </Button>
              </form>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
