// /features/purchasing/components/CreateGRNModal.tsx
import AlertNote from "./AlertNote";
import { GoodsReceiptDTO } from "@/app/state/api";

type Props = {
  open: boolean;
  draft: GoodsReceiptDTO | null;
  onChange: (grn: GoodsReceiptDTO) => void;
  onClose: () => void;
  onSaveDraft: () => void;
  onPost: () => void;
};

export default function CreateGRNModal({ open, draft, onChange, onClose, onSaveDraft, onPost }: Props) {
  if (!open || !draft) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Create Goods Receipt</h2>
          <p className="text-sm text-gray-600 mt-1">
            Linked PO: <span className="font-medium">{draft.poId}</span>
            {draft.invoiceId ? <> • Invoice: <span className="font-medium">{draft.invoiceId}</span></> : null}
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* header fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="GRN Date">
              <input type="date" className="w-full border rounded px-3 py-2"
                value={draft.date}
                onChange={(e) => onChange({ ...draft, date: e.target.value })}
              />
            </Field>
            <Field label="GRN Number">
              <input className="w-full border rounded px-3 py-2"
                value={draft.grnNumber}
                onChange={(e) => onChange({ ...draft, grnNumber: e.target.value })}
              />
            </Field>
            <Field label="Status">
              <input className="w-full border rounded px-3 py-2 bg-gray-50" value={draft.status} readOnly />
            </Field>
          </div>

          {/* lines */}
          <div className="border rounded">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <Th>SKU</Th><Th>Item</Th><Th>UOM</Th><Th>Received Qty</Th><Th>Unit Price</Th>
                </tr>
              </thead>
              <tbody>
                {draft.lines.map((ln, idx) => (
                  <tr key={idx} className="border-t">
                    <Td>{ln.sku ?? "-"}</Td>
                    <Td>{ln.name}</Td>
                    <Td>{ln.unit ?? "-"}</Td>
                    <Td>
                      <input
                        type="number"
                        className="w-24 border rounded px-2 py-1"
                        value={ln.receivedQty}
                        min={0}
                        onChange={(e) => {
                          const v = Number(e.target.value || 0);
                          const copy = { ...draft };
                          copy.lines[idx].receivedQty = v;
                          onChange(copy);
                        }}
                      />
                    </Td>
                    <Td>
                      <input
                        type="number"
                        step="0.01"
                        className="w-28 border rounded px-2 py-1"
                        value={ln.unitPrice ?? 0}
                        onChange={(e) => {
                          const v = Number(e.target.value || 0);
                          const copy = { ...draft };
                          (copy.lines[idx].unitPrice as number) = v;
                          onChange(copy);
                        }}
                      />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AlertNote text="Stock increases only when you POST the GRN. Adjust received quantities to match the physical shipment." />
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          <div className="space-x-2">
            <button onClick={onSaveDraft} className="px-4 py-2 bg-white border rounded">Save Draft</button>
            <button onClick={onPost} className="px-4 py-2 bg-green-600 text-white rounded">Post GRN</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const Field = ({ label, children }: any) => (
  <div>
    <label className="block text-sm text-gray-600 mb-1">{label}</label>
    {children}
  </div>
);
const Th = (p: any) => <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{p.children}</th>;
const Td = (p: any) => <td className="px-4 py-2 text-sm">{p.children}</td>;
