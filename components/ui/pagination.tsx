import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  /** Base path with query params preserved, e.g. "/items" */
  buildHref: (page: number) => string;
}

export function Pagination({ page, totalPages, buildHref }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" asChild disabled={page <= 1}>
        <Link
          href={buildHref(Math.max(1, page - 1))}
          aria-disabled={page <= 1}
          className={page <= 1 ? "pointer-events-none opacity-50" : ""}
        >
          <ChevronLeft className="mr-1 size-4" />
          Poprzednia
        </Link>
      </Button>
      <span className="text-sm text-muted-foreground">
        Strona {page} z {totalPages}
      </span>
      <Button variant="outline" size="sm" asChild disabled={page >= totalPages}>
        <Link
          href={buildHref(Math.min(totalPages, page + 1))}
          aria-disabled={page >= totalPages}
          className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
        >
          Następna
          <ChevronRight className="ml-1 size-4" />
        </Link>
      </Button>
    </div>
  );
}