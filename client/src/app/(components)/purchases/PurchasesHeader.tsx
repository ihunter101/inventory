// app/(private)/purchases/PurchasesHeader.tsx
"use client";

import { Package, FileText, Boxes, CheckCircle } from "lucide-react";
import Link from "next/link";
import { currency } from "@/lib/currency";

type StatProps = {
  icon: React.ReactNode;
  label: string;
  value: string | number;
};

const Stat = ({ icon, label, value }: StatProps) => (
  <div className="flex items-center rounded-2xl bg-white/90 p-6 shadow-card ring-1 ring-black/5 backdrop-blur">
    <div className="rounded-2xl bg-slate-50 p-3">{icon}</div>
    <div className="ml-4">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="text-2xl font-semibold text-ink-900">{value}</p>
    </div>
  </div>
);

type HeaderProps = {
  poCount: number;
  invoiceCount: number;
  grnCount: number;
  totalPOSpend: number;
};

export function PurchasesHeader({
  poCount,
  invoiceCount,
  grnCount,
  totalPOSpend,
}: HeaderProps) {
  return (
    <>
      {/* Top title + buttons */}
      <div className="mb-6 rounded-2xl bg-white/90 p-6 shadow-card ring-1 ring-black/5 backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-ink-900 lg:text-4xl">
              Purchases &amp; Invoicing
            </h1>
            <p className="mt-2 text-base text-ink-400 lg:text-lg">
              POs, supplier invoices, goods receipts (GRN), and matching
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/purchase-orders/new"
              className="inline-flex items-center gap-2 rounded-xl2 bg-blue-600 px-4 py-2.5 text-white shadow-card hover:shadow-cardHover"
            >
              <span className="inline-flex h-4 w-4 items-center justify-center">
                <Package className="h-4 w-4" />
              </span>
              New Purchase Order
            </Link>

            <Link
              href="/purchases/invoices/new"
              className="inline-flex items-center gap-2 rounded-xl2 bg-blue-600 px-4 py-2.5 text-white shadow-card hover:shadow-cardHover"
            >
              <FileText className="h-4 w-4" />
              New Invoice
            </Link>

            <button className="inline-flex items-center gap-2 rounded-xl2 border border-slate-200 bg-white px-4 py-2.5 text-ink-700 shadow-card transition-shadow hover:shadow-cardHover">
              {/* You can pass Download icon via props if you want */}
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={<Package className="h-6 w-6 text-blue-600" />}
          label="Active Orders"
          value={poCount}
        />
        <Stat
          icon={<FileText className="h-6 w-6 text-amber-600" />}
          label="Pending Invoices"
          value={invoiceCount}
        />
        <Stat
          icon={<Boxes className="h-6 w-6 text-violet-600" />}
          label="GRNs"
          value={grnCount}
        />
        <Stat
          icon={<CheckCircle className="h-6 w-6 text-emerald-600" />}
          label="Total PO Spend"
          value={currency(totalPOSpend)}
        />
      </div>
    </>
  );
}
