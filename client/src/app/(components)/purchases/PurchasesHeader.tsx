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
  <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all shadow-sm">
    <div className="flex items-start gap-4">
      <div className="p-3 bg-primary/10 rounded-lg text-primary">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm text-muted-foreground mb-1">
          {label}
        </div>
        <div className="text-2xl font-semibold text-foreground">
          {value}
        </div>
      </div>
    </div>
  </div>
);

type HeaderProps = {
  poCount: number;
  invoiceCount: number;
  grnCount: number;
  totalPayable: number;
  totalPaid: number;
};

export function PurchasesHeader({
  poCount,
  invoiceCount,
  grnCount,
  totalPayable,
  totalPaid,
}: HeaderProps) {
  return (
    <>
      {/* Top title + buttons */}
      <div className="bg-card border border-border rounded-2xl p-8 mb-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Purchases & Invoicing
              </h1>
            </div>
            <div>
              <p className="text-muted-foreground text-base">
                POs, supplier invoices, goods receipts (GRN), and matching
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              href="/purchase-orders/new"
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
            >
              <Package className="w-4 h-4" />
              New Purchase Order
            </Link>
            
            <Link 
              href="/invoices/new"
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
            >
              <FileText className="w-4 h-4" />
              New Invoice
            </Link>
            
            <button className="px-5 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg font-medium transition-colors">
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat
          icon={<Package className="w-5 h-5" />}
          label="Active Orders"
          value={poCount}
        />
        <Stat
          icon={<FileText className="w-5 h-5" />}
          label="Pending Invoices"
          value={invoiceCount}
        />
        <Stat
          icon={<Boxes className="w-5 h-5" />}
          label="GRNs"
          value={grnCount}
        />
        <Stat
          icon={<CheckCircle className="w-5 h-5" />}
          label="Payable / Paid"
          value={`${currency(totalPayable)} / ${currency(totalPaid)}`}
        />

      </div>
    </>
  );
}