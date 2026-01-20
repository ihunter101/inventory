import { useMemo, useState } from "react";
import {
  GoodsReceiptDTO,
  SupplierInvoiceDTO,
  PurchaseOrderDTO,
  GRNStatus,
  InvoiceStatus,
  POStatus,
} from "@/app/state/api";

/** Normalize UI status to enum form (e.g. "partially_received" -> "PARTIALLY_RECEIVED") */
const norm = (s?: string) =>
  (s ?? "").trim().toUpperCase().replace(/ /g, "_");

/**emfwekofm
 * @params fwjfofmfpmaf
*/
export function usePurchasingFilters(
  purchaseOrders: PurchaseOrderDTO[] = [],
  invoices: SupplierInvoiceDTO[] = [],
  grns: GoodsReceiptDTO[] = [],
  opts?: { search?: string; status?: string }
) {
  // (uncontrolled mode) if the parent component Purchases/page.tsx doesnt pass any props, then we manage the state through internal variable 
  const [localSearch, setLocalSearch] = useState("");
  const [localStatus, setLocalStatus] = useState("all");

  const searchTerm = opts?.search ?? localSearch;
  const statusFilter = opts?.status ?? localStatus;

  const q = (searchTerm || "").toLowerCase();
  const statusNorm = norm(statusFilter); // e.g., "ALL", "DRAFT", "PENDING", "POSTED", etc.

  // Helper: match against enum or pass-through when "all"
  const poStatusVal = statusNorm === "ALL" ? null : (statusNorm as POStatus);
  const invStatusVal = statusNorm === "ALL" ? null : (statusNorm as InvoiceStatus);
  const grnStatusVal = statusNorm === "ALL" ? null : (statusNorm as GRNStatus);

  /**
   * this function accept an argument and if arg is a sting it returns it else if the argument is an object and a name prop in that object ia string, it returns it 
   * @param v 
   * @returns 
   */
  const asSearchText = (v: unknown) => {
    if (typeof v === "string") return v;
    if ( v && typeof v === "object" && "name" in v && typeof(v as any).name === "string" ) {
      return (v as any).name
    }
    return ""
  }

  const includesQuery = (v: string, q: string) => {
    asSearchText(v).toLowerCase().includes(q)
  }

  

  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchesSearch =
        (po.supplier?.name.toLowerCase().includes(q) ?? false) ||
        (po.poNumber?.toLowerCase().includes(q) ?? false) ||
        (po.id?.toLowerCase().includes(q) ?? false) ||
        (po.items?.some(it => (it.sku || it.name || "").toLowerCase().includes(q)) ?? false);

      const matchesStatus = !poStatusVal || po.status === poStatusVal;
      return matchesSearch && matchesStatus;
    });
  }, [purchaseOrders, q, poStatusVal]);
  //
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        (inv.supplier?.toLowerCase().includes(q) ?? false) ||
        (inv.invoiceNumber?.toLowerCase().includes(q) ?? false) ||
        (inv.lines?.some(ln => (ln.sku || ln.name || "").toLowerCase().includes(q)) ?? false);

      const matchesStatus = !invStatusVal || inv.status === invStatusVal;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, q, invStatusVal]);

  const filteredGRNs = useMemo(() => {
    return grns.filter((grn) => {
      const matchesSearch =
        (grn.grnNumber?.toLowerCase().includes(q) ?? false) ||
        (grn.lines?.some(ln => ( ln.name || "").toLowerCase().includes(q)) ?? false);

      const matchesStatus = !grnStatusVal || grn.status === grnStatusVal;
      return matchesSearch && matchesStatus;
    });
  }, [grns, q, grnStatusVal]);

  // When the hook owns state, expose setters; when caller passes opts, keep them no-ops
  const setSearchTerm = opts ? (_: string) => {} : setLocalSearch;
  const setStatusFilter = opts ? (_: string) => {} : setLocalStatus;

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredPOs,
    filteredInvoices,
    filteredGRNs,
  };
}
