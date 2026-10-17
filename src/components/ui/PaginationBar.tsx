import React from 'react';
import { ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft } from 'lucide-react';

interface PaginationBarProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
}

export const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100, 250],
  itemLabel = 'تۆمار'
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIdx = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endIdx = Math.min(totalItems, safePage * pageSize);

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-50/90 border-t border-slate-200 text-xs">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-slate-600 font-medium">
          پیشاندانی <strong className="font-mono text-slate-900">{startIdx}–{endIdx}</strong> لە کۆی{' '}
          <strong className="font-mono text-cyan-700">{totalItems.toLocaleString()}</strong> {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <label className="text-[11px] text-slate-500 font-bold">ڕیز لە پەڕەدا:</label>
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              aria-label="ژمارەی ڕیز لە هەر پەڕەیەکدا"
              className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-mono font-bold text-xs cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
              {totalItems > 250 && <option value={totalItems}>هەمووی ({totalItems})</option>}
            </select>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav aria-label="پەڕەبەندی خشتە" className="flex items-center gap-1">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(1)}
            aria-label="پەڕەی یەکەم"
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(safePage - 1)}
            aria-label="پەڕەی پێشوو"
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <span className="px-3 py-1 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-900 font-mono font-bold text-xs">
            پەڕەی {safePage} لە {totalPages}
          </span>

          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(safePage + 1)}
            aria-label="پەڕەی دواتر"
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(totalPages)}
            aria-label="کۆتا پەڕە"
            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
        </nav>
      )}
    </div>
  );
};
