// /features/purchasing/components/GRNTable.tsx
import StatusBadge from "./StatusBadge";
import { GoodsReceiptDTO, SupplierInvoiceDTO, PurchaseOrderDTO } from "@/app/state/api";

interface Props  {
  data: GoodsReceiptDTO[];
  orders: PurchaseOrderDTO[];
  invoices: SupplierInvoiceDTO[];
};

export default function GRNTable({ data, orders, invoices }: Props) {
  const getPO = (id?: string) => orders.find((p) => p.id === id);
  const getInv = (id?: string) => invoices.find((i) => i.id === id);

  return (
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <Th>GRN</Th><Th>PO / Invoice</Th><Th>Date</Th><Th>Lines</Th><Th>Status</Th><Th />
        </tr>
      </thead>
      <tbody className="bg-white divide-y">
        {data.map((grn) => {
          const po = getPO(grn.poId);
          const inv = getInv(grn.invoiceId);
          return (
            <tr key={grn.id} className="hover:bg-gray-50">
              <Td className="font-medium">{grn.grnNumber}</Td>
              <Td className="text-sm">
                <div>PO: <span className="text-blue-700">{po?.id ?? grn.poId}</span></div>
                <div>Invoice: <span className="text-blue-700">{inv?.invoiceNumber ?? grn.invoiceId ?? "-"}</span></div>
              </Td>
              <Td className="text-sm">{grn.date}</Td>
              <Td className="text-sm">{grn.lines.length}</Td>
              <Td><StatusBadge status={grn.status} /></Td>
              <Td className="text-right">{/* actions if needed */}</Td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

const Th = (p: any) => <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{p.children}</th>;
const Td = (p: any) => <td className="px-6 py-4">{p.children}</td>;
