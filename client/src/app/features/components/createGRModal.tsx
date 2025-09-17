"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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

type Props = {
  open: boolean;
  draft: GoodsReceiptDTO | null;
  onChange: (grn: GoodsReceiptDTO) => void;
  onClose: () => void;
  /** called after successful POST so the page can jump to Match */
  onPosted?: (poId: string) => void;
};

function assertDefined<T>(v: T | null | undefined, msg: string): T {
  if (v == null) throw new Error(msg);
  return v;
}

function shortId(id?: string) {
  return id ? `${id.slice(0, 8)}…` : "-";
}

export default function CreateGRNModal({
  open,
  draft,
  onChange,
  onClose,
  onPosted,
}: Props) {
  const { toast } = useToast();
  const [createGRN, { isLoading: creating }] = useCreateGRNMutation();
  const [postGRN, { isLoading: posting }] = usePostGRNMutation();
  const [submitting, setSubmitting] = useState(false);
  const busy = creating || posting || submitting;

  // header: PO number/link + Invoice number
  const headerLine = useMemo(() => {
    if (!draft) return null;

    const poLabel = draft.poNumber || shortId(draft.poId);

    const poChunk = (
      <Link
        href={`/purchases?tab=match&po=${encodeURIComponent(draft.poId)}`}
        className="font-medium text-blue-600 hover:underline"
        title={`Open PO ${poLabel}`}
      >
        {poLabel}
      </Link>
    );

    const invChunk =
      draft.invoiceId &&
      (draft.invoiceNumber ?? draft.invoiceId) && (
        <>
          {" "}
          • Invoice: <span className="font-medium">{draft.invoiceNumber}</span>
        </>
      );

    return (
      <>
        PO: {poChunk}
        {invChunk}
      </>
    );
  }, [draft?.poId, draft?.poNumber, draft?.invoiceId, draft?.invoiceNumber]);

  /** Save as DRAFT and return the saved GRN so callers get the id */
  async function handleSaveDraft(): Promise<GoodsReceiptDTO> {
    setSubmitting(true);
    try {
      const d = assertDefined(draft, "No GRN draft to save");

      const linesPayload: GoodsReceiptLine[] = d.lines.map((ln) => ({
        productId: ln.productId,
        sku: ln.sku,
        name: ln.name ?? "",
        unit: ln.unit,
        receivedQty: ln.receivedQty,
        unitPrice: ln.unitPrice ?? 0,
      }));

      const saved = await createGRN({
        grnNumber: d.grnNumber,
        poId: d.poId,
        invoiceId: d.invoiceId,
        date: d.date,
        lines: linesPayload,
      }).unwrap();

      const next: GoodsReceiptDTO = { ...d, id: (saved as any).id };
      onChange(next);

      toast({ title: "GRN saved as draft", description: next.grnNumber });
      return next;
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Failed to save GRN",
        description: e?.data?.message || "Please try again.",
      });
      throw e;
    } finally {
      setSubmitting(false);
    }
  }

  /** POST (increments stock and updates PO server-side) */
  async function handlePost() {
    const d = assertDefined(draft, "No GRN draft to post");
    setSubmitting(true);
    try {
      // Ensure we have a real id to post
      let idToPost = d.id;
      if (!idToPost || idToPost.startsWith("GRN-DRAFT-")) {
        const saved = await handleSaveDraft();
        idToPost = saved.id;
      }

      await postGRN({ id: idToPost! }).unwrap();

      toast({ title: "GRN posted", description: d.grnNumber });
      onPosted?.(d.poId);
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
  }

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
          <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
            Create Goods Receipt
          </h2>
          <p className="mt-2 text-sm font-medium text-ink-700">{headerLine}</p>
        </div>

        <div className="space-y-6 p-6">
          {/* header fields */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="GRN Date">
              <input
                type="date"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-blue-500 transition focus:ring-2"
                value={draft.date}
                onChange={(e) => onChange({ ...draft, date: e.target.value })}
                disabled={busy}
              />
            </Field>
            <Field label="GRN Number">
              <input
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-blue-500 transition focus:ring-2"
                value={draft.grnNumber}
                onChange={(e) =>
                  onChange({ ...draft, grnNumber: e.target.value })
                }
                disabled={busy}
              />
            </Field>
            <Field label="Status">
              <input
                className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                value={draft.status}
                readOnly
              />
            </Field>
          </div>

          {/* lines */}
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <Th>SKU</Th>
                  <Th>Item</Th>
                  <Th>UOM</Th>
                  <Th>Received Qty</Th>
                  <Th>Unit Price</Th>
                </tr>
              </thead>
              <tbody>
                {draft.lines.map((ln, idx) => (
                  <tr key={idx} className="border-t">
                    <Td>{ln.sku ?? "-"}</Td>
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
                          const next: GoodsReceiptDTO = {
                            ...draft,
                            lines: draft.lines.map((l, i) =>
                              i === idx ? { ...l, receivedQty: v } : l
                            ),
                          };
                          onChange(next);
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
                          const next: GoodsReceiptDTO = {
                            ...draft,
                            lines: draft.lines.map((l, i) =>
                              i === idx ? { ...l, unitPrice: v } : l
                            ),
                          };
                          onChange(next);
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-sm font-medium text-ink-700">{label}</label>
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
