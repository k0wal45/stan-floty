import { requireAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { tenants, items, rentals, payments } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { derivePaymentStatus } from "@/lib/pricing";
import type { RentalWithPaymentInfo } from "@/types/rentals";
import type { RateUnit } from "@/types/items";
import { RentalCard } from "@/components/modules/rentals/rental-card";
import { Key, CheckCircle2, FileText, Building2 } from "lucide-react";

export default async function DashboardPage() {
  const user = await requireAuthenticatedUser();

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, user.tenantId))
    .limit(1);

  // 1. Items stats
  const itemsStats = await db
    .select({
      status: items.status,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(items)
    .where(eq(items.tenantId, user.tenantId))
    .groupBy(items.status);

  let availableCount = 0;
  let rentedCount = 0;
  itemsStats.forEach((s) => {
    if (s.status === "AVAILABLE") availableCount = s.count;
    if (s.status === "RENTED") rentedCount = s.count;
  });

  // 2. Active rentals stats
  const [activeStats] = await db
    .select({
      totalActive: sql<number>`count(*)`.mapWith(Number),
      unpaidCount: sql<number>`sum(case when ${rentals.totalPrice} > COALESCE((SELECT SUM(${payments.amount}) FROM ${payments} WHERE ${payments.rentalId} = ${rentals.id}), 0) then 1 else 0 end)`.mapWith(Number),
    })
    .from(rentals)
    .where(
      and(
        eq(rentals.tenantId, user.tenantId),
        eq(rentals.status, "ACTIVE")
      )
    );

  const totalActive = activeStats?.totalActive || 0;
  const unpaidCount = activeStats?.unpaidCount || 0;

  // 3. Closest 3 ending rentals
  const upcomingRentalsData = await db
    .select({
      id: rentals.id,
      tenantId: rentals.tenantId,
      itemId: rentals.itemId,
      customerName: rentals.customerName,
      customerPhone: rentals.customerPhone,
      customerIdentifier: rentals.customerIdentifier,
      startDate: rentals.startDate,
      endDate: rentals.endDate,
      initialEndDate: rentals.initialEndDate,
      rateSnapshot: rentals.rateSnapshot,
      rateUnitSnapshot: rentals.rateUnitSnapshot,
      totalPrice: rentals.totalPrice,
      status: rentals.status,
      attachments: rentals.attachments,
      createdAt: rentals.createdAt,
      updatedAt: rentals.updatedAt,
      itemName: items.name,
      itemIdentifier: items.identifier,
      totalPaid: sql<number>`COALESCE((
        SELECT SUM(${payments.amount})
        FROM ${payments}
        WHERE ${payments.rentalId} = ${rentals.id}
      ), 0)`.mapWith(Number),
    })
    .from(rentals)
    .leftJoin(items, eq(items.id, rentals.itemId))
    .where(
      and(
        eq(rentals.tenantId, user.tenantId),
        eq(rentals.status, "ACTIVE")
      )
    )
    .orderBy(rentals.endDate)
    .limit(3);

  const upcomingRentals: RentalWithPaymentInfo[] = upcomingRentalsData.map((r) => ({
    ...r,
    attachments: (r.attachments as import("@/types/rentals").RentalAttachment[]) || null,
    itemName: r.itemName ?? "Usunięty zasób",
    itemIdentifier: r.itemIdentifier ?? "",
    rateUnitSnapshot: r.rateUnitSnapshot as RateUnit,
    status: r.status as "ACTIVE" | "COMPLETED" | "CANCELLED",
    paymentStatus: derivePaymentStatus(r.totalPrice, r.totalPaid),
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Pulpit" description={`Witaj, ${user.fullName}`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Rented Now */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              Wypożyczone teraz
            </h2>
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
              <Key className="size-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-blue-600 dark:text-blue-400">{rentedCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            liczba aktywnych zasobów
          </p>
        </div>

        {/* Available Now */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              Wolne teraz
            </h2>
            <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
              <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-green-600 dark:text-green-400">{availableCount}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            zasoby gotowe do wynajmu
          </p>
        </div>

        {/* Active Rentals + Unpaid */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              Aktywne wypożyczenia
            </h2>
            <div className="rounded-full bg-slate-100 p-2 dark:bg-slate-800">
              <FileText className="size-4 text-slate-600 dark:text-slate-400" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold">{totalActive}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            z czego{" "}
            <span
              className={
                unpaidCount > 0
                  ? "font-semibold text-destructive"
                  : "font-semibold text-green-600 dark:text-green-400"
              }
            >
              {unpaidCount} nieopłaconych
            </span>
          </p>
        </div>

        {/* Organization */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              Organizacja
            </h2>
            <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
              <Building2 className="size-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="mt-4 text-xl font-bold truncate">{tenant?.name ?? "—"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Twój plan: {tenant?.plan ?? "—"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Najbliższe zwroty ({upcomingRentals.length})
        </h2>
        
        {upcomingRentals.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            Brak aktywnych wypożyczeń ze zbliżającym się terminem zwrotu.
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
            {upcomingRentals.map((rental) => (
              <RentalCard key={rental.id} rental={rental} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
