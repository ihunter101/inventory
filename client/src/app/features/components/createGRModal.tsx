"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toaster";
import {
  GoodsReceiptDTO,
  GoodsReceiptLine,
  useCreateGRNMutation,
  usePostGRNMutation,
} from "@/app/state/api";
import AlertNote from "./AlertNote";

type CreateGRNDialogProps = {
  open: boolean;
  draft: GoodsReceiptDTO | null;
  onChange: (grn: GoodsReceiptDTO) => void;
  onClose: () => void;
  onPosted: (poId: string) => Promise<void>;
};

/**
 * CreateGRNDialog - A dialog for creating Goods Receipt Notes from an invoice
 * 
 * This is a wrapper around the GRN creation logic that:
 * - Initializes GRN draft from invoice data
 * - Handles save draft and post operations
 * - Manages loading states
 * - Shows success/error toasts
 */
export function CreateGRNDialog({
  open,
  draft,
  onChange,
  onClose,
  onPosted,
}: CreateGRNDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [createGRN, { isLoading: creating }] = useCreateGRNMutation();
  const [postGRN, { isLoading: posting }] = usePostGRNMutation();
  const [submitting, setSubmitting] = useState(false);

  const busy = creating || posting || submitting;

  // Save as DRAFT
  const handleSaveDraft = async (): Promise<GoodsReceiptDTO | null> => {
    if (!draft) return null;

    setSubmitting(true);
    try {
      // Validate lines have draftProductId
      const invalidLines = draft.lines.filter((ln) => !ln.productDraftId);
      if (invalidLines.length > 0) {
        toast({
          variant: "destructive",
          title: "Invalid lines",
          description: "All lines must have a product selected",
        });
        return null;
      }

      const linesPayload: GoodsReceiptLine[] = draft.lines.map((ln) => ({
        productDraftId: ln.productDraftId,
        poItemId: ln.poItemId,
        name: ln.name ?? "",
        unit: ln.unit,
        receivedQty: ln.receivedQty,
        unitPrice: ln.unitPrice ?? 0,
      }));

      console.log("GRN CREATE payload", {
        poId: draft.poId,
        invoiceId: draft.invoiceId,
        lines: linesPayload.map(l => ({ 
          draftProductId: l.productDraftId, 
          poItemId: l.poItemId 
        }))
      });

      const saved = await createGRN({
        grnNumber: draft.grnNumber,
        poId: draft.poId,
        invoiceId: draft.invoiceId,
        date: draft.date,
        lines: linesPayload,
      }).unwrap();

      console.log("Fulfilled:", saved);

      const updatedDraft: GoodsReceiptDTO = { ...draft, id: saved.id };
      onChange(updatedDraft);

      toast({ title: "GRN saved as draft", description: updatedDraft.grnNumber });
      return updatedDraft;
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Failed to save GRN",
        description: e?.data?.message || "Please try again.",
      });
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  // POST (increments stock)
  const handlePost = async () => {
    if (!draft) return;

    setSubmitting(true);
    try {
      // Ensure we have a real ID
      let idToPost = draft.id;
      if (!idToPost || idToPost.startsWith("LSC-GR-")) {
        const saved = await handleSaveDraft();
        if (!saved) return;
        idToPost = saved.id;
      }

      await postGRN({ id: idToPost }).unwrap();
      //router.push(`/promotions?grnId=${encodeURIComponent(grnId)}`);

      toast({ title: "GRN posted successfully", description: draft.grnNumber });
      
      // Call onPosted with the PO ID
      if (draft.poId) {
        await onPosted(draft.poId);
      }
      
      onClose();
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Failed to post GRN",
        description: e?.data?.message || "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !draft) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl">
        {busy && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-sm">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span>Submitting…</span>
          </div>
        )}

        {/* Header */}
        <div className="border-b p-6">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Create Goods Receipt
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-700">
            Invoice: <span className="text-slate-900">{draft.invoiceNumber}</span>
            {draft.poNumber && (
              <>
                {" • PO: "}
                <span className="text-slate-900">{draft.poNumber}</span>
              </>
            )}
          </p>
        </div>

        <div className="space-y-6 p-6">
          {/* Header Fields */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* GRN Date */}
            <Field label="GRN Date">
              <input
                type="date"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-blue-500 transition focus:ring-2"
                value={draft.date}
                onChange={(e) => onChange({ ...draft, date: e.target.value })}
                disabled={busy}
              />
            </Field>

            {/* GRN Number */}
            <Field label="GRN Number">
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-blue-500 transition focus:ring-2"
                value={draft.grnNumber}
                onChange={(e) => onChange({ ...draft, grnNumber: e.target.value })}
                disabled={busy}
              />
            </Field>

            {/* Status */}
            <Field label="Status">
              <input
                className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                value={draft.status}
                readOnly
              />
            </Field>
          </div>

          {/* Lines Table */}
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Item</Th>
                  <Th>Unit</Th>
                  <Th>Received Qty</Th>
                  <Th>Unit Price</Th>
                </tr>
              </thead>
              <tbody>
                {draft.lines.map((ln, idx) => (
                  <tr key={idx} className="border-t">
                    <Td className="max-w-[22rem]">
                      <div className="truncate">{ln.name}</div>
                    </Td>
                    <Td>{ln.unit ?? "-"}</Td>
                    <Td>
                      <input
                        type="number"
                        className="w-24 rounded-lg border border-slate-300 px-2 py-1 outline-none ring-blue-500 transition focus:ring-2"
                        value={ln.receivedQty}
                        min={0}
                        onChange={(e) => {
                          const v = Number(e.target.value || 0);
                          onChange({
                            ...draft,
                            lines: draft.lines.map((l, i) =>
                              i === idx ? { ...l, receivedQty: v } : l
                            ),
                          });
                        }}
                        disabled={busy}
                      />
                    </Td>
                    <Td>
                      <input
                        type="number"
                        step="0.01"
                        className="w-28 rounded-lg border border-slate-300 px-2 py-1 outline-none ring-blue-500 transition focus:ring-2"
                        value={ln.unitPrice ?? 0}
                        onChange={(e) => {
                          const v = Number(e.target.value || 0);
                          onChange({
                            ...draft,
                            lines: draft.lines.map((l, i) =>
                              i === idx ? { ...l, unitPrice: v } : l
                            ),
                          });
                        }}
                        disabled={busy}
                      />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AlertNote text="Stock increases only when you POST the GRN. Adjust received quantities to match the physical shipment." />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t bg-slate-50 px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <div className="space-x-2">
            <Button variant="secondary" onClick={handleSaveDraft} disabled={busy}>
              {submitting && !posting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                "Save Draft"
              )}
            </Button>
            <Button onClick={handlePost} disabled={busy}>
              {posting || submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Posting…
                </>
              ) : (
                "Post GRN"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

const Th = (p: any) => (
  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">
    {p.children}
  </th>
);

const Td = (p: any) => <td className="px-4 py-2 align-top">{p.children}</td>;