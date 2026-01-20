"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { useDispatch } from "react-redux";
import { addExpense } from "@/app/state";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChevronDownIcon } from "lucide-react";
import { format } from "date-fns";

import type { Expense, ExpenseGroup } from "../../state/api";
import { useCreateExpenseMutation } from "../../state/api";

// --- helpers / constants ---

const DEFAULT_CATEGORIES = [
  "PPE",
  "Phlebotomy",
  "Reagents",
  "Tubes & Containers",
  "Microbiology",
  "POCT",
  "Utilities",
  "Office Supplies",
];

const GROUP_OPTIONS: ExpenseGroup[] = [
  "Clinical",
  "Equipment and Infrastructure",
  "Logistics and Overhead",
];

function generateExpenseId(date: Date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `exp-${mm}-${dd}-${yyyy}-N`;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function toYMD(d: Date) {
  // YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}

const AddExpenseDialog = () => {
  // Dialog open state (ONLY for dialog)
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Popover open state (ONLY for calendar popover)
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);

  const [amount, setAmount] = React.useState<number>(0);
  const [category, setCategory] = React.useState<string>("");
  const [group, setGroup] = React.useState<ExpenseGroup | "">("");

  // ✅ Calendar state uses Date | undefined
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  const [expenseId, setExpenseId] = React.useState<string>("");
  const [categories, setCategories] = React.useState<string[]>(DEFAULT_CATEGORIES);
  const [newCategory, setNewCategory] = React.useState<string>("");

  const dispatch = useDispatch();
  const [createExpense, { isLoading }] = useCreateExpenseMutation();

  const today = React.useMemo(() => startOfDay(new Date()), []);

  // When dialog opens, prefill date + ID
  React.useEffect(() => {
    if (!dialogOpen) return;

    const d = new Date();
    setDate(d);
    setExpenseId(generateExpenseId(d));

    // optional: reset other fields on open
    setAmount(0);
    setCategory("");
    setGroup("");
    setNewCategory("");
  }, [dialogOpen]);

  // Keep expenseId in sync with selected date
  React.useEffect(() => {
    if (date) setExpenseId(generateExpenseId(date));
  }, [date]);

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;

    setCategories((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    setCategory(trimmed);
    setNewCategory("");
  };

  const handleSubmit = async () => {
    if (amount <= 0) {
      toast.error("Amount must be greater than 0");
      return;
    }
    if (!category) {
      toast.error("Please select a category");
      return;
    }
    if (!group) {
      toast.error("Please select a group");
      return;
    }
    if (!date) {
      toast.error("Please select a date");
      return;
    }

    // prevent past dates
    if (startOfDay(date) < today) {
      toast.error("Date cannot be in the past");
      return;
    }

    try {
      // IMPORTANT:
      // - If your backend expects Date objects, you can pass `date` directly.
      // - If it expects a string (common), send YYYY-MM-DD:
      //   date: toYMD(date)
      const payload: Partial<Expense> = {
        amount,
        category,
        group: group as ExpenseGroup,
        date: toYMD(date) as any, // remove "as any" if your Expense.date is typed as string
        expenseId,
      };

      const newExpense = await createExpense(payload).unwrap();
      dispatch(addExpense(newExpense));

      toast.success("Expense added successfully");
      setDialogOpen(false);
    } catch (err) {
      console.error("Create expense error:", err);
      toast.error("Failed to add expense");
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Add Expense</Button>
      </DialogTrigger>

      <DialogContent className="space-y-4">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
        </DialogHeader>

        {/* Expense ID (read-only) */}
        <div className="space-y-2">
          <Label>Expense ID</Label>
          <Input value={expenseId} disabled />
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder="$0.00"
            value={amount === 0 ? "" : String(amount)}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setAmount(Number.isNaN(val) ? 0 : val);
            }}
          />
        </div>

        {/* Category (dropdown + add new) */}
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent
              className="z-[70] bg-white border border-slate-200 shadow-lg"
              position="popper"
            >
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="mt-2 flex gap-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Add new category"
            />
            <Button type="button" variant="outline" onClick={handleAddCategory}>
              Add
            </Button>
          </div>
        </div>

        {/* Group */}
        <div className="space-y-2">
          <Label>Group</Label>
          <Select
            value={group || undefined}
            onValueChange={(value) => setGroup(value as ExpenseGroup)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select group" />
            </SelectTrigger>
            <SelectContent
              className="z-[70] bg-white border border-slate-200 shadow-lg"
              position="popper"
            >
              {GROUP_OPTIONS.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date (calendar popover, no past dates) */}
        <div className="space-y-2">
          <Label className="text-sm text-slate-600">Select a Date</Label>

          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="mt-2 h-11 w-full justify-between text-[15px] font-normal"
              >
                {date ? format(date, "PPP") : "Select date"}
                <ChevronDownIcon className="h-4 w-4 opacity-70" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  if (!d) return;
                  // prevent selecting past dates directly
                  if (startOfDay(d) < today) {
                    toast.error("Date cannot be in the past");
                    return;
                  }
                  setDate(d);
                  setDatePickerOpen(false);
                }}
                captionLayout="dropdown"
                disabled={(d) => startOfDay(d) < today}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
          {isLoading ? "Saving..." : "Submit"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseDialog;
