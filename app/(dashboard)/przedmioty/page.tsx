import { requireAuthenticatedUser } from "@/lib/auth";
import { getItems } from "@/server/actions/items";
import { CreateItemDialog } from "@/components/modules/items/create-item-dialog";
import { ItemCard } from "@/components/modules/items/item-card";
import { ItemsFilter } from "@/components/modules/items/items-filter";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";

export default async function ItemsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await requireAuthenticatedUser();
  const params = await searchParams;

  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const search = typeof params.search === "string" ? params.search : "";
  const status = typeof params.status === "string" ? params.status : "ALL";

  const { items, totalPages } = await getItems({ page, search, status });

  const canManage = user.role === "OWNER" || user.role === "MANAGER";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Zasoby" description="Zarządzaj zasobami swojej floty">
        {canManage && <CreateItemDialog />}
      </PageHeader>

      <ItemsFilter search={search} status={status} />

      {items.length === 0 ? (
        <EmptyState message="Nie znaleziono żadnych zasobów. Dodaj pierwszy zasób, aby rozpocząć." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} canManage={canManage} />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        buildHref={(p) =>
          `/items?page=${p}&search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`
        }
      />
    </div>
  );
}
