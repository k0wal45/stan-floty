import { requireAuthenticatedUser } from "@/lib/auth";
import { db } from "@/db";
import { items, rentals, payments } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, CalendarRange, CheckCircle2, CircleDollarSign, Hash, Key } from "lucide-react";
import { ItemCalendar } from "@/components/modules/items/item-calendar";
import { STATUS_LABELS } from "@/types/items";
import { cn, formatCurrency } from "@/lib/utils";

export default async function ItemDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const user = await requireAuthenticatedUser();

  // 1. Fetch item
  const [item] = await db
    .select()
    .from(items)
    .where(
      and(
        eq(items.id, resolvedParams.id),
        eq(items.tenantId, user.tenantId)
      )
    )
    .limit(1);

  if (!item) {
    notFound();
  }

  // 2. Fetch stats
  const [stats] = await db
    .select({
      totalRentals: sql<number>`count(distinct ${rentals.id})`.mapWith(Number),
      totalEarned: sql<number>`COALESCE(sum(${payments.amount}), 0)`.mapWith(Number),
    })
    .from(rentals)
    .leftJoin(payments, eq(payments.rentalId, rentals.id))
    .where(
      and(
        eq(rentals.itemId, item.id),
        eq(rentals.tenantId, user.tenantId)
      )
    );

  // 3. Fetch rentals for the calendar
  const itemRentals = await db
    .select({
      id: rentals.id,
      startDate: rentals.startDate,
      endDate: rentals.endDate,
      status: rentals.status,
      customerName: rentals.customerName,
    })
    .from(rentals)
    .where(
      and(
        eq(rentals.itemId, item.id),
        eq(rentals.tenantId, user.tenantId)
      )
    )
    .orderBy(rentals.startDate);

  const statusInfo = STATUS_LABELS[item.status];
  const isRentedNow = item.status === "RENTED";

  return (
    <div className="flex flex-col gap-6 max-w-6xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="shrink-0">
          <Link href="/przedmioty">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <PageHeader 
          title={item.name} 
          description={`Kategoria: ${item.category} • ID: ${item.identifier}`} 
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Status */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              Obecny status
            </h2>
            <div className={cn(
              "rounded-full p-2",
              isRentedNow ? "bg-blue-100 dark:bg-blue-900/30" : "bg-green-100 dark:bg-green-900/30"
            )}>
              {isRentedNow ? (
                <Key className={cn("size-4 text-blue-600 dark:text-blue-400")} />
              ) : (
                <CheckCircle2 className={cn("size-4 text-green-600 dark:text-green-400")} />
              )}
            </div>
          </div>
          <p className={cn(
            "mt-4 text-3xl font-bold",
            isRentedNow ? "text-blue-600 dark:text-blue-400" : "text-green-600 dark:text-green-400"
          )}>
            {statusInfo.label}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isRentedNow ? "Zasób w użyciu" : "Gotowy do wynajmu"}
          </p>
        </div>

        {/* Total Rentals */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              Liczba wypożyczeń
            </h2>
            <div className="rounded-full bg-slate-100 p-2 dark:bg-slate-800">
              <Hash className="size-4 text-slate-600 dark:text-slate-400" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold">{stats?.totalRentals || 0}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Zarejestrowane umowy
          </p>
        </div>

        {/* Total Earned */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              Zarobiono łącznie
            </h2>
            <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/30">
              <CircleDollarSign className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-amber-600 dark:text-amber-400">
            {formatCurrency(stats?.totalEarned || 0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Suma wpłaconych kwot
          </p>
        </div>

        {/* Base Rate */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              Stawka cennikowa
            </h2>
            <div className="rounded-full bg-purple-100 p-2 dark:bg-purple-900/30">
              <CalendarRange className="size-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold">
            {formatCurrency(item.rate)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            za 1 {item.rateUnit === "DAY" ? "dobę" : item.rateUnit === "HOUR" ? "godzinę" : item.rateUnit === "WEEK" ? "tydzień" : "miesiąc"}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <ItemCalendar rentals={itemRentals} />
      </div>
    </div>
  );
}