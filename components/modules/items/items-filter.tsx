import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import Form from "next/form";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-[200px]";

interface ItemsFilterProps {
  search: string;
  status: string;
}

export function ItemsFilter({ search, status }: ItemsFilterProps) {
  return (
    <div className="flex w-full">
      <Form action="/przedmioty" className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            name="search"
            placeholder="Szukaj po nazwie lub kategorii..."
            defaultValue={search}
            className="w-full pl-8"
          />
        </div>
        <div className="flex gap-2 sm:shrink-0">
          <select
            name="status"
            defaultValue={status}
            className={selectClassName}
          >
            <option value="ALL">Wszystkie statusy</option>
            <option value="AVAILABLE">Dostępne</option>
            <option value="RENTED">Wypożyczone</option>
            <option value="MAINTENANCE">W serwisie</option>
          </select>
          <Button type="submit" variant="default" className="px-8 font-medium shadow-sm">
            Filtruj
          </Button>
        </div>
      </Form>
    </div>
  );
}