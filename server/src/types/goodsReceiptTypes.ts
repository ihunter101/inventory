export type GrnItem = {
  productName: string;
  unit: string;
  receivedQty: number;

  unitPrice?: number;
  lineTotal?: number;
}

export type GrnData = {
  id: string;
  grnNumber: string;

  supplier: {
    name: string;
    email?: string;
  },
  receivedDate?: string;
  preparedBy: string;
  notes?: string;

  items: GrnItem[];

  subtotal?: number;
  tax?: number;
  total?: number;
}