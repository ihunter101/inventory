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
import { useDispatch } from "react-redux"
import { addExpense } from "@/app/state";

const AddExpenseDialog = () => {
  const [open, setOpen] = React.useState(false);
  const [amount, setAmount] = React.useState(0);
  const [category, setCategory] = React.useState("");
  const [date, setDate] = React.useState("");

  const dispatch = useDispatch();
  const [createExpense, { isLoading }] = useCreateExpenseMutation();

  const handleSubmit = async () => {
    if (!amount || !category || !date) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const newExpense = await createExpense({ amount, category, date }).unwrap();
      dispatch(addExpense(newExpense));
      toast.success("Expense added successfully");
      setOpen(false);
      setAmount(0);
      setCategory("");
      setDate("");
    } catch (err) {
      toast.error("Failed to add expense");
    }
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
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value))}
            placeholder="Enter amount"
          />
        </div>
        <div className="space-y-2">
          <Label>Category</Label>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Supplies, Equipment"
          />
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
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
