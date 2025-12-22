"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type Props = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number; // how many pages around current
};

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export default function ProductsPagination({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
}: Props) {
  if (totalPages <= 1) return null;

  const safePage = Math.min(Math.max(page, 1), totalPages);

  const showLeftEllipsis = safePage - siblingCount > 2;
  const showRightEllipsis = safePage + siblingCount < totalPages - 1;

  const firstPage = 1;
  const lastPage = totalPages;

  const middleStart = Math.max(2, safePage - siblingCount);
  const middleEnd = Math.min(totalPages - 1, safePage + siblingCount);
  const middlePages = range(middleStart, middleEnd);

  const go = (p: number) => onPageChange(Math.min(Math.max(p, 1), totalPages));

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (safePage > 1) go(safePage - 1);
            }}
            aria-disabled={safePage === 1}
          />
        </PaginationItem>

        {/* First page */}
        <PaginationItem>
          <PaginationLink
            href="#"
            isActive={safePage === firstPage}
            onClick={(e) => {
              e.preventDefault();
              go(firstPage);
            }}
          >
            {firstPage}
          </PaginationLink>
        </PaginationItem>

        {/* Left ellipsis */}
        {showLeftEllipsis && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        {/* Middle pages */}
        {middlePages.map((p) => (
          <PaginationItem key={p}>
            <PaginationLink
              href="#"
              isActive={safePage === p}
              onClick={(e) => {
                e.preventDefault();
                go(p);
              }}
            >
              {p}
            </PaginationLink>
          </PaginationItem>
        ))}

        {/* Right ellipsis */}
        {showRightEllipsis && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}

        {/* Last page (avoid duplicate if totalPages === 1) */}
        {totalPages > 1 && (
          <PaginationItem>
            <PaginationLink
              href="#"
              isActive={safePage === lastPage}
              onClick={(e) => {
                e.preventDefault();
                go(lastPage);
              }}
            >
              {lastPage}
            </PaginationLink>
          </PaginationItem>
        )}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (safePage < totalPages) go(safePage + 1);
            }}
            aria-disabled={safePage === totalPages}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
