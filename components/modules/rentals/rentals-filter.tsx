"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, X } from "lucide-react";
import Form from "next/form";
import { useState } from "react";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-[160px]";

const dateInputClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface RentalsFilterProps {
  search: string;
  status: string;
  sort: string;
  startFrom: string;
  startTo: string;
  endFrom: string;
  endTo: string;
  paymentStatus: string;
  customerIdentifier: string;
  itemName: string;
}

export function RentalsFilter({
  search, status, sort,
  startFrom, startTo, endFrom, endTo,
  paymentStatus, customerIdentifier, itemName,
}: RentalsFilterProps) {
  const hasAdvanced = !!(startFrom || startTo || endFrom || endTo || paymentStatus || customerIdentifier || itemName);
  const [showAdvanced, setShowAdvanced] = useState(hasAdvanced);

  return (
    <div className="flex w-full">
      <Form
        action="/wypozyczenia"
        className="flex w-full flex-col gap-3"
      >
        {/* Row 1: Search + Status + Sort + Actions */}
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              name="search"
              placeholder="Szukaj po nazwisku lub telefonie..."
              defaultValue={search}
              className="w-full pl-8"
            />
          </div>
          <div className="flex flex-wrap gap-2 sm:shrink-0">
            <select
              name="status"
              defaultValue={status}
              className={selectClassName}
            >
              <option value="ALL">Wszystkie statusy</option>
              <option value="ACTIVE">Aktywne</option>
              <option value="COMPLETED">Zakończone</option>
              <option value="CANCELLED">Anulowane</option>
            </select>
            <select
              name="sort"
              defaultValue={sort}
              className={selectClassName}
            >
              <option value="created_desc">Utworzenie ↓</option>
              <option value="start_desc">Start ↓</option>
              <option value="start_asc">Start ↑</option>
              <option value="end_desc">Oddanie ↓</option>
              <option value="end_asc">Oddanie ↑</option>
            </select>
            <Button
              type="button"
              variant={showAdvanced ? "secondary" : "outline"}
              size="icon"
              className="size-10 shrink-0"
              onClick={() => setShowAdvanced((v) => !v)}
            >
              {showAdvanced ? <X className="size-4" /> : <SlidersHorizontal className="size-4" />}
            </Button>
            <Button
              type="submit"
              variant="default"
              className="px-8 font-medium shadow-sm"
            >
              Filtruj
            </Button>
          </div>
        </div>

        {/* Row 2: Advanced filters (collapsible) */}
        {showAdvanced && (
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Start od</label>
                <input
                  type="datetime-local"
                  name="startFrom"
                  defaultValue={startFrom}
                  className={dateInputClassName}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Start do</label>
                <input
                  type="datetime-local"
                  name="startTo"
                  defaultValue={startTo}
                  className={dateInputClassName}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Oddanie od</label>
                <input
                  type="datetime-local"
                  name="endFrom"
                  defaultValue={endFrom}
                  className={dateInputClassName}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Oddanie do</label>
                <input
                  type="datetime-local"
                  name="endTo"
                  defaultValue={endTo}
                  className={dateInputClassName}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Status płatności</label>
                <select
                  name="paymentStatus"
                  defaultValue={paymentStatus}
                  className={selectClassName + " !w-full"}
                >
                  <option value="">Wszystkie</option>
                  <option value="PAID">Opłacone</option>
                  <option value="PARTIALLY_PAID">Częściowo opłacone</option>
                  <option value="UNPAID">Nieopłacone</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Nr identyfikacyjny klienta</label>
                <Input
                  name="customerIdentifier"
                  placeholder="np. PESEL, NIP..."
                  defaultValue={customerIdentifier}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Nazwa zasobu</label>
                <Input
                  name="itemName"
                  placeholder="Szukaj po nazwie zasobu..."
                  defaultValue={itemName}
                />
              </div>
            </div>
          </div>
        )}
      </Form>
    </div>
  );
}
