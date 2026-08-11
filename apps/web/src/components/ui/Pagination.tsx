"use client";

import React from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 15,
  onPageChange,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1 && (!totalItems || totalItems <= pageSize)) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : currentPage * pageSize;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 ${className}`}>
      {totalItems !== undefined && (
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
          Showing <span className="text-slate-900 dark:text-white font-extrabold">{startItem}</span> to{" "}
          <span className="text-slate-900 dark:text-white font-extrabold">{endItem}</span> of{" "}
          <span className="text-slate-900 dark:text-white font-extrabold">{totalItems}</span> records
        </p>
      )}

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage <= 1}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition"
          aria-label="Previous Page"
        >
          <CaretLeft weight="bold" className="text-sm" />
        </button>

        {getPageNumbers().map((page, idx) => {
          if (page === "...") {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 text-xs font-bold text-slate-400">
                ...
              </span>
            );
          }

          const pageNum = Number(page);
          const isActive = pageNum === currentPage;

          return (
            <button
              key={`page-${pageNum}`}
              onClick={() => onPageChange(pageNum)}
              className={`min-w-[32px] h-8 px-2.5 rounded-xl text-xs font-extrabold transition ${
                isActive
                  ? "bg-brand-main dark:bg-brand-500 text-brand-950 dark:text-slate-950 shadow-sm"
                  : "border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage >= totalPages}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-300 transition"
          aria-label="Next Page"
        >
          <CaretRight weight="bold" className="text-sm" />
        </button>
      </div>
    </div>
  );
}
