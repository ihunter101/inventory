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
import { useCreateExpenseMutation } from "../../state/api";
import { useDispatch } from "react-redux";
import { addExpense } from "@/app/state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const GROUP_OPTIONS = [
  "Clinical",
  "Equipment & Infrastructure",
  "Logistics & Overhead",
];

function generateExpenseId(date: Date) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `exp-${mm}-${dd}-${yyyy}-N`; // N = normal (not from PO)
}

function getTodayString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`; // YYYY-MM-DD for <input type="date">
}

const AddExpenseDialog = () => {
  const [open, setOpen] = React.useState(false);

  const [amount, setAmount] = React.useState(0);
  const [category, setCategory] = React.useState("");
  const [group, setGroup] = React.useState("");
  const [date, setDate] = React.useState("");

  const [expenseId, setExpenseId] = React.useState("");
  const [categories, setCategories] = React.useState<string[]>(DEFAULT_CATEGORIES);
  const [newCategory, setNewCategory] = React.useState("");

  const dispatch = useDispatch();
  const [createExpense, { isLoading }] = useCreateExpenseMutation();

  const todayString = React.useMemo(() => getTodayString(), []);

  // When dialog opens, prefill date and ID
  React.useEffect(() => {
    if (open) {
      const today = new Date();
      setDate(getTodayString());
      setExpenseId(generateExpenseId(today));
    } else {
      // optional: reset when closed
      setAmount(0);
      setCategory("");
      setGroup("");
      setNewCategory("");
    }
  }, [open]);

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

    // extra safety: prevent backdating
    if (date < todayString) {
      toast.error("Date cannot be in the past");
      return;
    }

    try {
      const payload = {
        amount,
        category,
        group,
        date,
        expenseId, // BE can treat this as id or external ref
      };

      const newExpense = await createExpense(payload).unwrap();
      dispatch(addExpense(newExpense));

      toast.success("Expense added successfully");
      setOpen(false);
    } catch (err) {
      console.error("Create expense error:", err);
      toast.error("Failed to add expense");
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDate(value);

    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      setExpenseId(generateExpenseId(d));
    }
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;

    if (!categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed]);
    }
    setCategory(trimmed);
    setNewCategory("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            value={amount === 0 ? "" : amount}
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
          <div className="flex gap-2 mt-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Add new category"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddCategory}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Group */}
        <div className="space-y-2">
          <Label>Group</Label>
          <Select value={group} onValueChange={setGroup}>
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

        {/* Date – no past dates */}
        <div className="space-y-2">
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={handleDateChange}
            min={todayString} // blocks past dates in picker
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Saving..." : "Submit"}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default AddExpenseDialog;
