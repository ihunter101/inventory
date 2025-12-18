// app/(private)/purchases/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GoodsReceiptDTO,
  SupplierInvoiceDTO,
  PurchaseOrderDTO,
  POStatus,
  InvoiceStatus,
  useGetPurchaseOrdersQuery,
  useGetSupplierInvoicesQuery,
  useGetGoodsReceiptsQuery,
  usePostGRNMutation,
} from "@/app/state/api";
import { usePurchasingFilters } from "@/app/hooks/usePurchaseingHooks";
import PurchaseTable from "@/app/features/components/PurchasesTable";
import InvoiceTable from "@/app/features/components/invoiceTable";
import GRNTable from "@/app/features/components/GoodsReceiptTable";
import MatchTable from "@/app/features/components/MatchTable";
import CreateGRNModal from "@/app/features/components/createGRModal";

import { PurchasesHeader } from "@/app/(components)/purchases/PurchasesHeader";
import { PurchasesToolbar } from "@/app/(components)/purchases/PurchasesToolbar";
import { PurchasesTabs, Tab } from "@/app/(components)/purchases/PurchasesTabs";

const POSTATUS = {
  DRAFT: "DRAFT",
  APPROVED: "APPROVED",
  SENT: "SENT",
  PARTIALLY_RECEIVED: "PARTIALLY_RECEIVED",
  RECEIVED: "RECEIVED",
  CLOSED: "CLOSED"
} as const;

// --- status mappers (with new enum) ---
function mapPOStatus(s?: string): POStatus | undefined {
  if (!s || s === "all") return undefined;
  const m: Record<string, POStatus> = {
    draft: POSTATUS.DRAFT,
    sent: POSTATUS.SENT,
    approved: POSTATUS.APPROVED,
    closed: POSTATUS.CLOSED,
  };
  return m[s];
}

const InvStatus = { PENDING: "PENDING", PAID: "PAID", OVERDUE: "OVERDUE" } as const;

function mapInvoiceStatus(s?: string): InvoiceStatus | undefined {
  if (!s || s === "all") return undefined;
  const m: Record<string, InvoiceStatus> = {
    pending: InvStatus.PENDING,
    paid: InvStatus.PAID,
    overdue: InvStatus.OVERDUE,
  };
  return m[s];
}

export default function PurchasesPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [activeTab, setActiveTab] = useState<Tab>("purchases");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [postingId, setPostingId] = useState<string | null>(null);
  const [grnDraft, setGrnDraft] = useState<GoodsReceiptDTO | null>(null);
  const [showGRNModal, setShowGRNModal] = useState(false);
  const [matchPOId, setMatchPOId] = useState<string | null>(null);

  // adopt URL params on first render
  useEffect(() => {
    const qTab = params.get("tab") as Tab | null;
    const qStatus = params.get("status");
    const qPO = params.get("po");
    if (qTab) setActiveTab(qTab);
    if (qStatus) setStatusFilter(qStatus);
    if (qPO) setMatchPOId(qPO);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // queries
  const {
    data: purchaseOrders = [],
    isLoading: poLoading,
    isError: poError,
    refetch: refetchPOs,
  } = useGetPurchaseOrdersQuery(
    { q: searchTerm, status: mapPOStatus(statusFilter) },
    { refetchOnMountOrArgChange: true }
  );

  const {
    data: invoices = [],
    isLoading: invLoading,
    isError: invError,
    refetch: refetchInvoices,
  } = useGetSupplierInvoicesQuery(
    { q: searchTerm, status: mapInvoiceStatus(statusFilter) },
    { refetchOnMountOrArgChange: true }
  );

  const [postGRN] = usePostGRNMutation();

  const {
    data: goodsReceipts = [],
    isLoading: grnLoading,
    isError: grnError,
    refetch: refetchGRNs,
  } = useGetGoodsReceiptsQuery(
    { q: searchTerm },
    { refetchOnMountOrArgChange: true }
  );

  // derived flags
  const loading =
    (activeTab === "purchases" && poLoading) ||
    (activeTab === "invoices" && invLoading) ||
    (activeTab === "grns" && grnLoading) ||
    (activeTab === "match" && (poLoading || invLoading || grnLoading));

  const errored =
    (activeTab === "purchases" && poError) ||
    (activeTab === "invoices" && invError) ||
    (activeTab === "grns" && grnError) ||
    (activeTab === "match" && (poError || invError || grnError));

  // client-side filters
  const { filteredPOs, filteredInvoices, filteredGRNs } = usePurchasingFilters(
    purchaseOrders,
    invoices,
    goodsReceipts,
    { search: searchTerm, status: statusFilter }
  );

  // GRN draft from invoice
  const openGRNFromInvoice = (invoice: SupplierInvoiceDTO) => {
    const po = purchaseOrders.find((p) => p.id === invoice.poId);
    const poId = invoice.poId ?? po?.id;
    if (!poId) {
      console.error("Cannot create GRN: invoice is not linked to a PO.");
      return;
    }

    const draft: GoodsReceiptDTO = {
      id: `LSC-GR-${new Date().toISOString().slice(0, 10)}`,
      grnNumber: `LSC-GR-${new Date().toISOString().slice(0, 10)}`,
      poId,
      poNumber: po?.poNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      date: new Date().toISOString().slice(0, 10),
      status: "DRAFT",
      lines: (invoice.lines?.length ? invoice.lines : po?.items ?? []).map(
        (ln: any) => {
          console.log("Mapping line:", ln);

          return {
            // Try to get draftProductId from multiple possible sources
            draftProductId: ln.draftProductId ?? ln.productId ?? ln.id,
            name: ln.name,
            unit: ln.unit ?? "",
            receivedQty: ln.quantity ?? 0,
            unitPrice: ln.unitPrice,
          };
        }
      ),
    };

    console.log("lines Page:", draft.lines);
    console.log("GRN Draft created:", draft);
    console.log("Draft lines:", draft.lines);

    setGrnDraft(draft);
    setShowGRNModal(true);
  };

  // matching context
  const poForMatch: PurchaseOrderDTO | undefined = useMemo(() => {
    const id = matchPOId ?? filteredPOs[0]?.id;
    return purchaseOrders.find((p) => p.id === id);
  }, [matchPOId, filteredPOs, purchaseOrders]);

  const invForMatch: SupplierInvoiceDTO | undefined = useMemo(() => {
    if (!poForMatch) return undefined;
    return invoices.find((i) => i.poId === poForMatch.id);
  }, [poForMatch, invoices]);

  const grnForMatch: GoodsReceiptDTO | undefined = useMemo(() => {
    if (!poForMatch) return undefined;
    const byInvoice =
      invForMatch &&
      goodsReceipts.find(
        (g) => g.poId === poForMatch.id && g.invoiceId === invForMatch.id
      );
    return byInvoice ?? goodsReceipts.find((g) => g.poId === poForMatch.id);
  }, [poForMatch, invForMatch, goodsReceipts]);

  // after posting GRN
  async function handlePosted(poId: string) {
    await Promise.all([refetchGRNs(), refetchPOs(), refetchInvoices()]);
    setActiveTab("match");
    setMatchPOId(poId);
    router.push(`/purchases?tab=match&po=${encodeURIComponent(poId)}`);
  }

  async function handlePostGRN(grnId: string) {
    setPostingId(grnId);

    try {
      await postGRN({ id: grnId }).unwrap();
      await refetchGRNs(); // Let the query update naturally
    } catch (error) {
      console.error(error);
    } finally {
      setPostingId(null);
    }
  }

  const totalPOSpend = purchaseOrders.reduce(
    (s, p) => s + Number(p.total ?? 0),
    0
  );

  return (
    <div className="w-full">
      <PurchasesHeader
        poCount={purchaseOrders.length}
        invoiceCount={invoices.filter((i) => i.status === "PENDING").length}
        grnCount={goodsReceipts.length}
        totalPOSpend={totalPOSpend}
      />

      <div className="rounded-2xl bg-card shadow-card ring-1 ring-border backdrop-blur mt-6">
        <PurchasesTabs active={activeTab} onChange={setActiveTab} />

        <PurchasesToolbar
          activeTab={activeTab}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />

        <div className="overflow-x-auto">
          {loading && <div className="p-6 text-muted-foreground">Loading {activeTab}…</div>}
          {errored && <div className="p-6 text-destructive">Error loading {activeTab}.</div>}

          {!loading && !errored && activeTab === "purchases" && (
            <PurchaseTable data={filteredPOs} />
          )}

          {!loading && !errored && activeTab === "invoices" && (
            <InvoiceTable
              data={filteredInvoices}
              goodsReceipts={goodsReceipts}
              onCreateGRN={openGRNFromInvoice}
              onOpenMatch={(poId) => {
                setActiveTab("match");
                if (poId) setMatchPOId(poId);
                router.push(
                  `/purchases?tab=match${poId ? `&po=${encodeURIComponent(poId)}` : ""}`
                );
              }}
            />
          )}

          {!loading && !errored && activeTab === "grns" && (
            <GRNTable
              data={filteredGRNs}
              onOpenMatch={(poId) => {
                setActiveTab("match");
                setMatchPOId(poId);
                router.push(`/purchases?tab=match&po=${poId}`);
              }}
              orders={[]}
              invoices={[]}
              postingId={postingId}
              onPost={handlePostGRN}
            />
          )}

          {!loading && !errored && activeTab === "match" && (
            <MatchTable
              po={poForMatch}
              invoice={invForMatch}
              grn={grnForMatch}
              allPOs={purchaseOrders}
              currentPOId={matchPOId}
              onChangePO={(poId) => {
                setMatchPOId(poId);
                router.push(`/purchases?tab=match&po=${poId}`);
              }}
            />
          )}
        </div>
      </div>

      <CreateGRNModal
        open={showGRNModal}
        draft={grnDraft}
        onChange={setGrnDraft}
        onClose={() => setShowGRNModal(false)}
        onPosted={handlePosted}
      />
    </div>
  );
}