import { ChevronLeft, ChevronRight } from "lucide-react";

interface TablePaginationProps {
  totalItems: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
}

export function TablePagination({
  totalItems,
  pageSize,
  currentPage,
  onPageChange,
  itemLabel = "items",
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(totalItems, currentPage * pageSize);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="px-5 py-3 border-t bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
      <span className="text-xs text-gray-500 dark:text-slate-400">
        Showing {start}-{end} of {totalItems} {itemLabel}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-gray-300 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <ChevronLeft size={14} /> Prev
        </button>
        <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
          {currentPage}/{totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-gray-300 text-xs text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
