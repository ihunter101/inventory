"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  onPosted: (ctx: { poId: string; invoiceId?: string; grnId: string }) => Promise<void>;
};

export function CreateGRNDialog({
  open,
  draft,
  onChange,
  onClose,
  onPosted,
}: CreateGRNDialogProps) {
  const [createGRN, { isLoading: creating }] = useCreateGRNMutation();
  const [postGRN, { isLoading: posting }] = usePostGRNMutation();
  const [submitting, setSubmitting] = useState(false);

  const busy = creating || posting || submitting;

  // Save as DRAFT
  const handleSaveDraft = async (): Promise<GoodsReceiptDTO | null> => {
    if (!draft) return null;

    setSubmitting(true);
     console.log("Draft lines:", draft.lines?.map(ln => ({
      invoiceItemId: ln.invoiceItemId,
      productDraftId: ln.productDraftId,
      hasInvoiceItemId: !!ln.invoiceItemId,
      hasProductDraftId: !!ln.productDraftId,
    })));
    try {
      // Validate lines have productDraftId
      const invalidLines = (draft.lines ?? []).filter((ln) => !ln.productDraftId);
      if (invalidLines.length > 0) {
        toast.error("Invalid lines", {
          description: "All lines must have a product selected.",
        });
        return null;
      }

      const linesPayload: GoodsReceiptLine[] = (draft.lines ?? []).map((ln) => ({
        invoiceItemId: ln.invoiceItemId!,   // ✅ keep (new workflow)
        productDraftId: ln.productDraftId,
        poItemId: ln.poItemId,             // ✅ keep
        name: ln.name ?? "",
        unit: ln.unit,
        receivedQty: Number(ln.receivedQty ?? 0),
        unitPrice: Number(ln.unitPrice ?? 0),
      }));

      const saved = await createGRN({
        grnNumber: draft.grnNumber,
        poId: draft.poId,
        invoiceId: draft.invoiceId,
        date: draft.date,
        lines: linesPayload,
      }).unwrap();

      const updatedDraft: GoodsReceiptDTO = { ...draft, id: saved.id };
      onChange(updatedDraft);

      // ✅ Sonner toast: draft saved
      toast.success("Draft saved", {
        description: `GRN ${updatedDraft.grnNumber} saved successfully.`,
      });

      onClose();
      return updatedDraft;
    } catch (e: any) {
      toast.error("Failed to save GRN", {
        description: e?.data?.message || e?.message || "Please try again.",
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

      toast.success("GRN posted successfully", {
        description: `GRN ${draft.grnNumber} posted.`,
      });

      // Call onPosted with the PO ID
      if (draft.poId) {
        await onPosted({
          poId: draft.poId,
          invoiceId: draft.invoiceId,
          grnId: idToPost,
        });
      }

      onClose();
    } catch (e: any) {
      toast.error("Failed to post GRN", {
        description: e?.data?.message || e?.message || "Please try again.",
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
                readOnly
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

// allow className since you used it in another file sometimes
const Td = ({ children, className = "" }: any) => (
  <td className={`px-4 py-2 align-top ${className}`}>{children}</td>
);
