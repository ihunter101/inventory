// /features/purchasing/components/PurchaseTable.tsx
import { Building, Edit3, Eye, MoreVertical } from "lucide-react";
import { PurchaseOrderDTO } from "@/app/state/api";
import StatusBadge from "./StatusBadge";
import { currency } from "../../../lib/currency";

type Props = { data: PurchaseOrderDTO[] };

export default function PurchaseTable({ data }: Props) {
  return (
    <table className="w-full">
      <thead className="bg-gray-50">
        <tr>
          <Th>PO</Th><Th>Supplier</Th><Th>Date</Th><Th>Amount</Th><Th>Status</Th><Th>Actions</Th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y">
        {data.map((po) => (
          <tr key={po.id} className="hover:bg-gray-50">
            <Td>
              <div className="font-medium">{po.id}</div>
              <div className="text-sm text-gray-500">{po.category}</div>
            </Td>
            <Td>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full mr-3" />
                <div className="text-sm font-medium">{po.supplier}</div>
              </div>
            </Td>
            <Td>
              <div className="text-sm">{po.orderDate}</div>
              <div className="text-xs text-gray-500">Due: {po.dueDate ?? "-"}</div>
            </Td>
            <Td>
              <div className="text-sm font-medium">{currency(po.total)}</div>
              <div className="text-xs text-gray-500">{po.items.length} items</div>
            </Td>
            <Td><StatusBadge status={po.status} /></Td>
            <Td className="text-right">
              <div className="flex gap-2 justify-end">
                <IconBtn><Eye className="w-4 h-4" /></IconBtn>
                <IconBtn><Edit3 className="w-4 h-4" /></IconBtn>
                <IconBtn><MoreVertical className="w-4 h-4" /></IconBtn>
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
const IconBtn = (p: any) => <button className="text-gray-600 hover:text-gray-900">{p.children}</button>;
