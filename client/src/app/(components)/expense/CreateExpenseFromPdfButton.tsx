"use client";

import { useState } from "react";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { UploadButton } from "@/utils/uploadthing";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  useCreateExpenseDocumentMutation,
  useExtractExpenseDocumentMutation,
  useSaveExpenseFromDocumentMutation,
} from "@/app/state/api";

type ExpenseGroup =
  | "CLINICAL"
  | "EQUIPMENT_INFRASTRUCTURE"
  | "LOGISTICS_OVERHEAD";

type FormState = {
  companyName: string;
  vendorName: string;
  invoiceNumber: string;
  expenseDate: string;
  dueDate: string;
  category: string;
  amount: number;
  description: string;
  group: ExpenseGroup;
  notes: string;
};

const initialFormState: FormState = {
  companyName: "",
  vendorName: "",
  invoiceNumber: "",
  expenseDate: "",
  dueDate: "",
  category: "",
  amount: 0,
  description: "",
  group: "CLINICAL",
  notes: "",
};

export default function CreateExpenseFromPdfButton() {
  const [open, setOpen] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [aiReviewData, setAiReviewData] = useState<any>(null);

  const [createExpenseDocument, { isLoading: isCreatingDocument }] =
    useCreateExpenseDocumentMutation();

  const [extractExpenseDocument, { isLoading: isExtracting }] =
    useExtractExpenseDocumentMutation();

  const [saveExpenseFromDocument, { isLoading: isSaving }] =
    useSaveExpenseFromDocumentMutation();

  const isBusy = isCreatingDocument || isExtracting || isSaving;

  function resetDialogState() {
    setDocumentId(null);
    setFormData(initialFormState);
    setAiReviewData(null);
  }

  async function handleUploadComplete(res: any[]) {
    try {
      console.log("UploadThing client result:", res);

      const uploadedFile = res?.[0];

      if (!uploadedFile) {
        console.error("No uploaded file returned from UploadThing.");
        return;
      }

      console.log("Uploaded file:", uploadedFile);
      console.log("Server data:", uploadedFile.serverData);

      const serverData = uploadedFile.serverData;

      const created = await createExpenseDocument({
        uploadThingKey: serverData?.uploadThingKey ?? uploadedFile.key,
        fileUrl:
          serverData?.fileUrl ??
          uploadedFile.ufsUrl ??
          uploadedFile.url,
        fileName: serverData?.fileName ?? uploadedFile.name,
        mimeType:
          serverData?.mimeType ??
          uploadedFile.type ??
          "application/pdf",
        sizeBytes: serverData?.sizeBytes ?? uploadedFile.size,
      }).unwrap();

      console.log("Created ExpenseDocument:", created);

      const newDocumentId = created.document.documentId;
      setDocumentId(newDocumentId);

      const extracted = await extractExpenseDocument(newDocumentId).unwrap();

      console.log("AI extracted data:", extracted);

      setAiReviewData(extracted.extractedData);

      setFormData({
        companyName: extracted.extractedData.companyName ?? "",
        vendorName: extracted.extractedData.vendorName ?? "",
        invoiceNumber: extracted.extractedData.invoiceNumber ?? "",
        expenseDate: extracted.extractedData.invoiceDate ?? "",
        dueDate: extracted.extractedData.dueDate ?? "",
        category: extracted.extractedData.category ?? "",
        amount:
          extracted.extractedData.total ??
          extracted.extractedData.amount ??
          extracted.extractedData.subtotal ??
          0,
        description: extracted.extractedData.description ?? "",
        group: extracted.extractedData.group ?? "CLINICAL",
        notes: extracted.extractedData.notes ?? "",
      });
    } catch (error) {
      console.error("PDF upload/AI extraction flow failed:", error);

      alert(
        `PDF uploaded, but the AI expense flow failed. Check console/network tab.\n\nError: ${JSON.stringify(
          error,
          null,
          2
        )}`
      );
    }
  }

  async function handleSaveExpense() {
    try {
      if (!documentId) {
        alert("No uploaded document found.");
        return;
      }

      await saveExpenseFromDocument({
        documentId,
        body: {
        companyName: formData.companyName,
        vendorName: formData.vendorName,
        invoiceNumber: formData.invoiceNumber,
        expenseDate: formData.expenseDate || undefined,
        dueDate: formData.dueDate || undefined,
        category: formData.category,
        amount: Number(formData.amount),
        description: formData.description,
        group: formData.group,
        notes: formData.notes,
      },
      }).unwrap();

      setOpen(false);
      resetDialogState();
    } catch (error) {
      console.error("Failed to save expense:", error);

      alert(
        `Failed to save expense. Check console/network tab.\n\nError: ${JSON.stringify(
          error,
          null,
          2
        )}`
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);

        if (!value) {
          resetDialogState();
        }
      }}
    >
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="gap-2 rounded-full border-border/70 bg-background/80 shadow-sm hover:bg-muted/50"
              >
                <span className="relative flex items-center">
                  <FileText className="h-4 w-4" />
                  <Sparkles className="absolute -right-2 -top-2 h-3 w-3 text-primary" />
                </span>
                Create From PDF
              </Button>
            </DialogTrigger>
          </TooltipTrigger>

          <TooltipContent side="bottom" align="end">
            <p>
              Upload an invoice PDF and let AI fill the expense form for review.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Expense From Invoice PDF
          </DialogTitle>

          <DialogDescription>
            Upload a PDF invoice. AI will extract the expense details, then you
            can review and save the final expense record.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-muted/20 p-4">
            <p className="mb-3 text-sm font-medium">Upload invoice PDF</p>

            <UploadButton
              endpoint="expenseInvoiceUploader"
              onClientUploadComplete={handleUploadComplete}
              onUploadError={(error: Error) => {
                console.error("Upload failed:", error);
                alert(`Upload failed: ${error.message}`);
              }}
              appearance={{
                button:
                  "rounded-full bg-primary px-4 py-2 text-primary-foreground",
                allowedContent: "text-xs text-muted-foreground",
              }}
            />
          </div>

          {isBusy && (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />

              {isCreatingDocument && "Saving uploaded PDF details..."}
              {isExtracting && "AI is scanning the invoice..."}
              {isSaving && "Saving final expense..."}
            </div>
          )}

          {aiReviewData && (
            <div className="rounded-2xl border border-border bg-background p-4">
              <h3 className="mb-3 text-sm font-semibold">
                AI extracted review details
              </h3>

              <div className="grid gap-3 text-sm md:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Company / Payee</p>
                  <p className="font-medium">
                    {aiReviewData.companyName || aiReviewData.vendorName || "Not found"}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Invoice Number</p>
                  <p className="font-medium">
                    {aiReviewData.invoiceNumber || "Not found"}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Invoice Date</p>
                  <p className="font-medium">
                    {aiReviewData.invoiceDate || "Not found"}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Due Date</p>
                  <p className="font-medium">
                    {aiReviewData.dueDate || "Not found"}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Subtotal</p>
                  <p className="font-medium">
                    {aiReviewData.subtotal ?? "Not found"}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-medium">
                    {aiReviewData.total ?? "Not found"}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Confidence</p>
                  <p className="font-medium">
                    {Math.round((aiReviewData.confidence ?? 0) * 100)}%
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Missing Fields</p>
                  <p className="font-medium">
                    {Array.isArray(aiReviewData.missingFields) &&
                    aiReviewData.missingFields.length > 0
                      ? aiReviewData.missingFields.join(", ")
                      : "None"}
                  </p>
                </div>
              </div>

              {Array.isArray(aiReviewData.lineItems) &&
                aiReviewData.lineItems.length > 0 && (
                  <div className="mt-4 overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">
                            Description
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Qty
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Unit Price
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Total
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {aiReviewData.lineItems.map(
                          (item: any, index: number) => (
                            <tr key={index} className="border-t border-border">
                              <td className="px-3 py-2">
                                {item.description ?? "-"}
                              </td>
                              <td className="px-3 py-2">
                                {item.quantity ?? "-"}
                              </td>
                              <td className="px-3 py-2">
                                {item.unitPrice ?? "-"}
                              </td>
                              <td className="px-3 py-2">
                                {item.total ?? "-"}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          )}

          {documentId && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <h3 className="mb-4 text-sm font-semibold">
                Review expense before saving
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="space-y-1">
                  <label className="text-sm font-medium">Company / Payee</label>
                  <input
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        companyName: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Company billing us"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Invoice Number</label>
                  <input
                    value={formData.invoiceNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        invoiceNumber: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="INV-0001"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Expense Date</label>
                  <input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        expenseDate: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        dueDate: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                  <label className="text-sm font-medium">Category</label>
                  <input
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Medical Supplies"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Amount</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        amount: Number(e.target.value),
                      }))
                    }
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="min-h-20 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Short description of the expense"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Group</label>
                  <select
                    value={formData.group}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        group: e.target.value as ExpenseGroup,
                      }))
                    }
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="CLINICAL">Clinical</option>
                    <option value="EQUIPMENT_INFRASTRUCTURE">
                      Equipment / Infrastructure
                    </option>
                    <option value="LOGISTICS_OVERHEAD">
                      Logistics / Overhead
                    </option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Notes</label>
                  <input
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Optional notes"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    resetDialogState();
                  }}
                  disabled={isBusy}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={handleSaveExpense}
                  disabled={isBusy || !formData.category || formData.amount < 0}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Expense"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}