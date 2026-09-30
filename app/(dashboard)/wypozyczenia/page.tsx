import { requireAuthenticatedUser } from "@/lib/auth";
import { getRentals } from "@/server/actions/rentals";
import { CreateRentalDialog } from "@/components/modules/rentals/create-rental-dialog";
import { RentalCard } from "@/components/modules/rentals/rental-card";
import { RentalsFilter } from "@/components/modules/rentals/rentals-filter";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";

export default async function RentalsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireAuthenticatedUser();
  const params = await searchParams;

  const page = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const search = typeof params.search === "string" ? params.search : "";
  const status = typeof params.status === "string" ? params.status : "ACTIVE";
  const sort = typeof params.sort === "string" ? params.sort : "created_desc";
  const startFrom = typeof params.startFrom === "string" ? params.startFrom : "";
  const startTo = typeof params.startTo === "string" ? params.startTo : "";
  const endFrom = typeof params.endFrom === "string" ? params.endFrom : "";
  const endTo = typeof params.endTo === "string" ? params.endTo : "";
  const paymentStatus = typeof params.paymentStatus === "string" ? params.paymentStatus : "";
  const customerIdentifier = typeof params.customerIdentifier === "string" ? params.customerIdentifier : "";
  const itemName = typeof params.itemName === "string" ? params.itemName : "";

  const { rentals, totalPages } = await getRentals({
    page, search, status, sort,
    startFrom, startTo, endFrom, endTo,
    paymentStatus, customerIdentifier, itemName
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Wypożyczenia"
        description="Zarządzaj wypożyczeniami"
      >
        <CreateRentalDialog />
      </PageHeader>

      <RentalsFilter 
        search={search} status={status} sort={sort}
        startFrom={startFrom} startTo={startTo} endFrom={endFrom} endTo={endTo}
        paymentStatus={paymentStatus} customerIdentifier={customerIdentifier} itemName={itemName}
      />

      {rentals.length === 0 ? (
        <EmptyState message="Nie znaleziono żadnych wypożyczeń. Utwórz pierwsze wypożyczenie, aby rozpocząć." />
      ) : (
        <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
          {rentals.map((rental) => (
            <RentalCard key={rental.id} rental={rental} />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        buildHref={(p) => {
          const params = new URLSearchParams();
          params.set("page", String(p));
          if (search) params.set("search", search);
          if (status) params.set("status", status);
          if (sort && sort !== "created_desc") params.set("sort", sort);
          if (startFrom) params.set("startFrom", startFrom);
          if (startTo) params.set("startTo", startTo);
          if (endFrom) params.set("endFrom", endFrom);
          if (endTo) params.set("endTo", endTo);
          if (paymentStatus) params.set("paymentStatus", paymentStatus);
          if (customerIdentifier) params.set("customerIdentifier", customerIdentifier);
          if (itemName) params.set("itemName", itemName);
          return `/wypozyczenia?${params.toString()}`;
        }}
      />
    </div>
  );
}
