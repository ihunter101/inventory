import type { PurchaseOrderDTO, Product, ProductDraft } from "@/app/state/api";

export type InvoiceFormProps = { onSuccess?: (invoiceNumber: string) => void };

export type LineRow = {
  id: string;          // ✅ stable key, never use array index keys
  productId?: string;
  poItemId?: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
};

export type ProductIndex = {
  byId: Map<string, ProductDraft>;
  byName: Map<string, ProductDraft>;
};

export type POSelectProps = {
  poSearch: string;
  setPoSearch: (v: string) => void;
  poSearching: boolean;
  displayedPOs: PurchaseOrderDTO[];
  selectedPO: PurchaseOrderDTO | null;
  onChoosePO: (po: PurchaseOrderDTO) => void;
  disabled?: boolean;
  onClearPO: () => void;
};
