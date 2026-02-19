"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import type { GoodsReceiptDTO } from "@/app/state/api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  title?: string;

  /** full GRN (preferably fresh from getGoodsReceipt) */
  grn: GoodsReceiptDTO | null;

  loading?: boolean;
  saving?: boolean;

  /** called with edited draft when user clicks Save */
  onSave: (draft: GoodsReceiptDTO) => Promise<void>;
};

function deepCloneGRN(grn: GoodsReceiptDTO): GoodsReceiptDTO {
  return {
    ...grn,
    lines: (grn.lines ?? []).map((l: any) => ({ ...l })),
  };
}

export function EditGoodsReceiptDialog({
  open,
  onOpenChange,
  title = "Edit Goods Receipt",
  grn,
  loading = false,
  saving = false,
  onSave,
}: Props) {
  const [draft, setDraft] = React.useState<GoodsReceiptDTO | null>(null);

  // When dialog opens + we have data, clone into editable state
  React.useEffect(() => {
    if (open && grn) setDraft(deepCloneGRN(grn));
    if (!open) setDraft(null);
  }, [open, grn]);

  const busy = loading || saving;

  const canEdit = draft?.status === "DRAFT";

  const patchLine = (idx: number, patch: Record<string, any>) => {
    if (!draft) return;
    setDraft({
      ...draft,
      lines: draft.lines.map((l: any, i: number) => (i === idx ? { ...l, ...patch } : l)),
    });
  };

  const handleSave = async () => {
    if (!draft) return;

    if (!canEdit) {
      toast.error("Only DRAFT GRNs can be edited.");
      return;
    }

    if (!draft.date) {
      toast.error("GRN date is required.");
      return;
    }

    for (const ln of draft.lines as any[]) {
      if (!ln.productDraftId) return toast.error("A line is missing productDraftId.");
      if (Number(ln.receivedQty ?? 0) < 0) return toast.error("Received Qty cannot be negative.");
      if (Number(ln.unitPrice ?? 0) < 0) return toast.error("Unit price cannot be negative.");
    }

    await onSave(draft);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl rounded-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Edit quantities/prices while the GRN is still in DRAFT.
          </DialogDescription>
        </DialogHeader>

        {(busy || loading) && (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        )}

        {!loading && !draft && (
          <div className="py-6 text-sm text-muted-foreground">No GRN loaded.</div>
        )}

        {!loading && draft && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="GRN Number">
                <input
                  className="w-full rounded-lg border bg-slate-50 px-3 py-2"
                  value={draft.grnNumber}
                  readOnly
                />
              </Field>

              <Field label="Status">
                <input
                  className="w-full rounded-lg border bg-slate-50 px-3 py-2"
                  value={draft.status}
                  readOnly
                />
              </Field>

              <Field label="GRN Date">
                <input
                  type="date"
                  className="w-full rounded-lg border px-3 py-2"
                  value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                  disabled={!canEdit || busy}
                />
              </Field>
            </div>

            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <Th>Item</Th>
                    <Th>Unit</Th>
                    <Th>Received Qty</Th>
                    <Th>Unit Price</Th>
                  </tr>
                </thead>
                <tbody>
                  {(draft.lines as any[]).map((ln, idx) => (
                    <tr key={ln.id ?? idx} className="border-t">
                      <Td className="max-w-[26rem]">
                        <div className="truncate">{ln.name ?? "-"}</div>
                      </Td>
                      <Td>{ln.unit ?? "-"}</Td>
                      <Td>
                        <input
                          type="number"
                          min={0}
                          className="w-24 rounded-lg border px-2 py-1"
                          value={Number(ln.receivedQty ?? 0)}
                          onChange={(e) => patchLine(idx, { receivedQty: Number(e.target.value || 0) })}
                          disabled={!canEdit || busy}
                        />
                      </Td>
                      <Td>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          className="w-28 rounded-lg border px-2 py-1"
                          value={Number(ln.unitPrice ?? 0)}
                          onChange={(e) => patchLine(idx, { unitPrice: Number(e.target.value || 0) })}
                          disabled={!canEdit || busy}
                        />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!canEdit || busy}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium text-slate-700">{label}</div>
      {children}
    </div>
  );
}

const Th = ({ children }: any) => (
  <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-muted-foreground">
    {children}
  </th>
);

const Td = ({ children, className = "" }: any) => (
  <td className={`px-4 py-2 align-top ${className}`}>{children}</td>
);
