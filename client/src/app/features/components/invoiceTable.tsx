// /features/purchasing/components/InvoiceTable.tsx
import { Download } from "lucide-react";
import { SupplierInvoiceDTO } from "@/app/state/api";
import StatusBadge from "./StatusBadge";
import { currency } from "../../../lib/currency";

type Props = {
  data: SupplierInvoiceDTO[];
  onCreateGRN: (invoice: SupplierInvoiceDTO) => void;
  onOpenMatch: (poId: string) => void;
};

export default function InvoiceTable({ data, onCreateGRN, onOpenMatch }: Props) {
  return (
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <Th>Invoice</Th><Th>Supplier</Th><Th>PO</Th><Th>Date</Th><Th>Amount</Th><Th>Status</Th><Th>Actions</Th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y">
        {data.map((inv) => (
          <tr key={inv.id} className="hover:bg-gray-50">
            <Td>
              <div className="font-medium">{inv.invoiceNumber}</div>
              <div className="text-sm text-gray-500">{inv.category}</div>
            </Td>
            <Td>{inv.supplier}</Td>
            <Td>
              <button className="text-blue-600 hover:text-blue-800" onClick={() => onOpenMatch(inv.poId)}>
                {inv.poId}
              </button>
            </Td>
            <Td>
              <div className="text-sm">{inv.date}</div>
              <div className="text-xs text-gray-500">Due: {inv.dueDate ?? "-"}</div>
            </Td>
            <Td><div className="text-sm font-medium">{currency(inv.amount)}</div></Td>
            <Td><StatusBadge status={inv.status} /></Td>
            <Td className="text-right">
              <div className="flex gap-2 justify-end">
                <button className="text-blue-600 hover:text-blue-900" onClick={() => onCreateGRN(inv)}>
                  Create GRN
                </button>
                <button className="text-gray-600 hover:text-gray-900"><Download className="w-4 h-4" /></button>
              </div>
            </Td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const Th = (p: any) => <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{p.children}</th>;
const Td = (p: any) => <td className="px-6 py-4">{p.children}</td>;
