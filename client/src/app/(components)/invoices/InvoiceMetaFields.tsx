"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  invoiceNumber: string;
  setInvoiceNumber: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  dueDate: string;
  setDueDate: (v: string) => void;
  disabled?: boolean;
};

export default function InvoiceMetaFields({
  invoiceNumber,
  setInvoiceNumber,
  date,
  setDate,
  dueDate,
  setDueDate,
  disabled,
}: Props) {
  return (
    <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
      <div>
        <Label className="text-sm text-slate-600">Invoice #</Label>
        <Input
          className="mt-2 h-11 text-[15px]"
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
          disabled={disabled}
          readOnly
        />
      </div>

      <div>
        <Label className="text-sm text-slate-600">Date</Label>
        <Input
          type="date"
          className="mt-2 h-11 text-[15px]"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={disabled}
          readOnly
        />
      </div>

      <div>
        <Label className="text-sm text-slate-600">Due date</Label>
        <Input
          type="date"
          className="mt-2 h-11 text-[15px]"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
