"use client";

import { useState } from "react";
import type { AdminTenant } from "@/types/admin";
import type { UserRole } from "@/types/auth";
import { AddTenantUserDialog } from "./AddTenantUserDialog";
import { ChangeUserPasswordDialog } from "./ChangeUserPasswordDialog";
import { ChangeUserRoleDialog } from "./ChangeUserRoleDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { DeleteTenantDialog } from "./DeleteTenantDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, ChevronDown, ChevronRight, Box, CalendarDays } from "lucide-react";

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

export function TenantCard({
  tenant,
  currentUserId,
  initiallyExpanded = false,
}: {
  tenant: AdminTenant;
  currentUserId: string;
  initiallyExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 border-b bg-muted/20">
        <div
          className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-0"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-base truncate">{tenant.name}</span>
              {tenant.nip && <span className="text-xs text-muted-foreground">NIP: {tenant.nip}</span>}
              <Badge variant="outline" className="text-[10px] h-5">{tenant.plan}</Badge>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1">
                <Users className="h-3 w-3" />{tenant.users.length} kont
              </span>
              <span className="inline-flex items-center gap-1">
                <Box className="h-3 w-3" />{tenant.itemCount} zasobów
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />{tenant.rentalCount} umów
              </span>
              <span>Utworzono: {new Date(tenant.createdAt).toLocaleDateString("pl-PL")}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <AddTenantUserDialog tenantId={tenant.id} tenantName={tenant.name} />
          <DeleteTenantDialog tenantId={tenant.id} tenantName={tenant.name} userCount={tenant.users.length} />
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 bg-background">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground pb-3">
            Konta użytkowników ({tenant.users.length})
          </h4>

          {tenant.users.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">Brak użytkowników.</p>
          ) : (
            <div className="divide-y rounded-md border">
              {tenant.users.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <div key={u.id} className="flex items-center justify-between px-3 py-2.5 text-sm gap-2">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{u.fullName}</span>
                        <Badge variant={roleVariant[u.role]} className="text-[10px] h-4 px-1.5">
                          {roleLabel[u.role]}
                        </Badge>
                        {isSelf && <span className="text-[10px] text-muted-foreground font-semibold">(Ty)</span>}
                      </div>
                      <span className="text-xs text-muted-foreground truncate">{u.email}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <ChangeUserPasswordDialog userId={u.id} userEmail={u.email} userFullName={u.fullName} />
                      <ChangeUserRoleDialog userId={u.id} userFullName={u.fullName} currentRole={u.role} />
                      <DeleteUserDialog userId={u.id} userFullName={u.fullName} userEmail={u.email} isSelf={isSelf} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
