// client/src/app/(components)/invoices/InvoiceMetaFields.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDownIcon } from "lucide-react";

type Props = {
  invoiceNumber: string;
  setInvoiceNumber: (v: string) => void;

  // ✅ Calendar works with Date
  date: Date | undefined;
  setDate: (v: Date | undefined) => void;

  dueDate: Date | undefined;
  setDueDate: (v: Date | undefined) => void;

  disabled?: boolean;
};

function DatePickerField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div>
      <Label className="text-sm text-slate-600">{label}</Label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="mt-2 h-11 w-full justify-between text-[15px] font-normal"
          >
            {value ? format(value, "PPP") : "Select date"}
            <ChevronDownIcon className="h-4 w-4 opacity-70" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d) => {
              onChange(d);
              setOpen(false);
            }}
            captionLayout="dropdown"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

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

      <DatePickerField label="Date" value={date} onChange={setDate} disabled={disabled} />

      <DatePickerField label="Due date" value={dueDate} onChange={setDueDate} disabled={disabled} />
    </div>
  );
}
