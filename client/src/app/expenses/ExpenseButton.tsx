"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

const AddExpenseButton = () => {
  const router = useRouter();

  return (
    <Button
      variant="default"
      onClick={() => router.push("/expenses/new")}
      className="mb-4"
    >
      <Plus className="mr-2 h-4 w-4" />
      Add Expense
    </Button>
  );
};

export default AddExpenseButton;
