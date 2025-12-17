// app/(private)/purchases/PurchasesTabs.tsx
"use client";

import { Package, FileText, Boxes, CheckCircle } from "lucide-react";

export type Tab = "purchases" | "invoices" | "grns" | "match";

type Props = {
  active: Tab;
  onChange: (t: Tab) => void;
};

export function PurchasesTabs({ active, onChange }: Props) {
  const tabs = [
    { id: "purchases", label: "Purchase Orders", icon: Package },
    { id: "invoices", label: "Invoices", icon: FileText },
    { id: "grns", label: "Goods Receipts", icon: Boxes },
    { id: "match", label: "Match", icon: CheckCircle },
  ] as const;

  return (
    <div className="border-b border-gray-700/50">
      <nav className="flex space-x-8 px-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id as Tab)}
            className={`py-4 px-1 text-sm font-medium transition-colors ${
              active === id
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-gray-400 hover:border-b-2 hover:border-gray-600 hover:text-gray-200"
            }`}
          >
            <Icon className="mr-2 inline h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}