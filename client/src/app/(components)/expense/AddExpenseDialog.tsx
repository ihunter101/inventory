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

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChevronDownIcon, Receipt, PlusCircle } from "lucide-react";
import { format } from "date-fns";

import type { Expense, ExpenseGroup } from "../../state/api";
import { useCreateExpenseMutation } from "../../state/api";

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

const GROUP_OPTIONS: { label: string; value: ExpenseGroup }[] = [
  { label: "Clinical", value: "CLINICAL" },
  { label: "Equipment and Infrastructure", value: "EQUIPMENT_INFRASTRUCTURE" },
  { label: "Logistics and Overhead", value: "LOGISTICS_OVERHEAD" },
];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

const AddExpenseDialog = () => {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [datePickerOpen, setDatePickerOpen] = React.useState(false);

  const [amount, setAmount] = React.useState<number>(0);
  const [category, setCategory] = React.useState<string>("");
  const [group, setGroup] = React.useState<ExpenseGroup | "">("");
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [categories, setCategories] = React.useState<string[]>(DEFAULT_CATEGORIES);
  const [newCategory, setNewCategory] = React.useState<string>("");

  const dispatch = useDispatch();
  const [createExpense, { isLoading }] = useCreateExpenseMutation();

  const today = React.useMemo(() => startOfDay(new Date()), []);

  React.useEffect(() => {
    if (!dialogOpen) return;

    setDate(new Date());
    setAmount(0);
    setCategory("");
    setGroup("");
    setNewCategory("");
  }, [dialogOpen]);

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

    if (startOfDay(date) < today) {
      toast.error("Date cannot be in the past");
      return;
    }

    try {
      const payload = {
        amount,
        category,
        group,
        status: "PENDING" as Expense["status"],
      };

      const newExpense = await createExpense(payload).unwrap();
      dispatch(addExpense(newExpense));

      toast.success("Expense added successfully");
      setDialogOpen(false);
    } catch (err: any) {
      console.error("Create expense error:", err);
      console.error("Create expense data:", err?.data);
      toast.error(err?.data?.error || "Failed to add expense");
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="rounded-xl">
          Add Expense
        </Button>
      </DialogTrigger>

      <DialogContent className="space-y-5 rounded-2xl border border-border/60 bg-card shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-foreground">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/15 bg-primary/10">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="block text-base font-semibold">Add New Expense</span>
              <span className="block text-sm font-normal text-muted-foreground">
                Record a new expense entry
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label className="text-foreground">Amount</Label>
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
            className="border-border/60 bg-background"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="border-border/60 bg-background">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent
              className="z-[70] border border-border/60 bg-popover shadow-lg"
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
              className="border-border/60 bg-background"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddCategory}
              className="rounded-xl"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground">Group</Label>
          <Select
            value={group || undefined}
            onValueChange={(value) => setGroup(value as ExpenseGroup)}
          >
            <SelectTrigger className="border-border/60 bg-background">
              <SelectValue placeholder="Select group" />
            </SelectTrigger>
            <SelectContent
              className="z-[70] border border-border/60 bg-popover shadow-lg"
              position="popper"
            >
              {GROUP_OPTIONS.map((g) => (
                <SelectItem key={g.value} value={g.value}>
                  {g.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-foreground">Select a Date</Label>

          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full justify-between border-border/60 bg-background text-[15px] font-normal"
              >
                {date ? format(date, "PPP") : "Select date"}
                <ChevronDownIcon className="h-4 w-4 opacity-70" />
              </Button>
            </PopoverTrigger>

            <PopoverContent
              className="w-auto overflow-hidden border border-border/60 bg-popover p-0 shadow-lg"
              align="start"
            >
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  if (!d) return;
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

        <Button onClick={handleSubmit} disabled={isLoading} className="w-full rounded-xl">
          {isLoading ? "Saving..." : "Submit"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseDialog;