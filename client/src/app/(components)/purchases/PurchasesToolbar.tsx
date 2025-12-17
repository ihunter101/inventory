// app/(private)/purchases/PurchasesToolbar.tsx
"use client";

import { Search, Filter } from "lucide-react";

type Props = {
  activeTab: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
};

export function PurchasesToolbar({
  activeTab,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: Props) {
  return (
    <div className="border-b border-slate-200 p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row">
        <div className="flex flex-1 gap-4">
          {/* Search */}
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 outline-none ring-blue-500 transition focus:ring-2"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 outline-none ring-blue-500 transition focus:ring-2"
          >
            {[
              "all",
              "draft",
              "sent",
              "approved",
              "closed",
              "pending",
              "paid",
              "overdue",
            ].map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <button className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-ink-700 transition hover:bg-slate-50">
          <Filter className="h-4 w-4" />
          More Filters
        </button>
      </div>
    </div>
  );
}
