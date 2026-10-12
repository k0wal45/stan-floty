"use client";

import { useState } from "react";
import type { AdminTenant } from "@/types/admin";
import { CreateTenantDialog } from "./CreateTenantDialog";
import { TenantCard } from "./TenantCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, Users, Shield, Search } from "lucide-react";

export function AdminDashboard({
  currentUserId,
  tenants,
}: {
  currentUserId: string;
  tenants: AdminTenant[];
}) {
  const [search, setSearch] = useState("");

  const totalUsers = tenants.reduce((acc, t) => acc + t.users.length, 0);

  const filteredTenants = tenants.filter((t) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      (t.nip && t.nip.includes(q)) ||
      t.users.some(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      )
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Panel Administratora</h1>
            <Badge variant="outline" className="gap-1 border-primary/30 text-primary">
              <Shield className="h-3 w-3" />
              Superadmin
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Zarządzaj wszystkimi zarejestrowanymi wypożyczalniami i ich kontami użytkowników.
          </p>
        </div>

        <CreateTenantDialog />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2.5 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Wypożyczalnie</p>
              <p className="text-2xl font-bold">{tenants.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary/10 p-2.5 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Użytkownicy w systemie</p>
              <p className="text-2xl font-bold">{totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Tryb rejestracji</p>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
              Zamknięty (Tylko Admin)
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            B2B SaaS
          </Badge>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Szukaj wypożyczalni lub użytkownika..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-4">
        {filteredTenants.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            Nie znaleziono żadnych wypożyczalni spełniających kryteria.
          </div>
        ) : (
          filteredTenants.map((tenant, idx) => (
            <TenantCard
              key={tenant.id}
              tenant={tenant}
              currentUserId={currentUserId}
              initiallyExpanded={idx === 0}
            />
          ))
        )}
      </div>
    </div>
  );
}

