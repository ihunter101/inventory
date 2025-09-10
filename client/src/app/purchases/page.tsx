"use client";

import {
  Plus,
  Upload,
  Download,
  Filter,
  Package,
  FileText,
  Boxes,
  CheckCircle,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  GoodsReceiptDTO,
  SupplierInvoiceDTO,
  PurchaseOrderDTO,
  POStatus,
  InvoiceStatus,
  useGetPurchaseOrdersQuery,
  useGetSupplierInvoicesQuery,
  useGetGoodsReceiptsQuery,
} from "@/app/state/api";
import { usePurchasingFilters } from "@/app/hooks/usePurchaseingHooks";
import { currency } from "../../lib/currency";
import PurchaseTable from "@/app/features/components/PurchasesTable";
import InvoiceTable from "@/app/features/components/invoiceTable";
import GRNTable from "@/app/features/components/GoodsReceiptTable";
import MatchTable from "@/app/features/components/MatchTable";
import CreateGRNModal from "@/app/features/components/createGRModal";
import CreatePODialog from "../features/CreatePOModal";

type Tab = "purchases" | "invoices" | "grns" | "match";

/* map UI filter -> API enums */
function mapPOStatus(s?: string): POStatus | undefined {
  if (!s || s === "all") return undefined;
  const m: Record<string, POStatus> = {
    draft: "DRAFT",
    approved: "APPROVED",
    sent: "SENT",
    partially_received: "PARTIALLY_RECEIVED",
    received: "RECEIVED",
    closed: "CLOSED",
  };
  return m[s];
}
function mapInvoiceStatus(s?: string): InvoiceStatus | undefined {
  if (!s || s === "all") return undefined;
  const m: Record<string, InvoiceStatus> = {
    pending: "PENDING",
    paid: "PAID",
    overdue: "OVERDUE",
  };
  return m[s];
}

export default function PurchasesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("purchases");
  const [grnDraft, setGrnDraft] = useState<GoodsReceiptDTO | null>(null);
  const [showGRNModal, setShowGRNModal] = useState(false);
  const [matchPOId, setMatchPOId] = useState<string | null>(null);

  // top filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // data
  const {
    data: purchaseOrders = [],
    isLoading: poLoading,
    isError: poError,
  } = useGetPurchaseOrdersQuery(
    { q: searchTerm, status: mapPOStatus(statusFilter) },
    { refetchOnMountOrArgChange: true }
  );

  const {
    data: invoices = [],
    isLoading: invLoading,
    isError: invError,
  } = useGetSupplierInvoicesQuery(
    { q: searchTerm, status: mapInvoiceStatus(statusFilter) },
    { refetchOnMountOrArgChange: true }
  );

  const {
    data: goodsReceipts = [],
    isLoading: grnLoading,
    isError: grnError,
  } = useGetGoodsReceiptsQuery(
    { q: searchTerm },
    { refetchOnMountOrArgChange: true }
  );

  // loading+error flags scoped by tab
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

  // client-side filtering (your hook)
  const { filteredPOs, filteredInvoices, filteredGRNs } = usePurchasingFilters(
    purchaseOrders,
    invoices,
    goodsReceipts,
    { search: searchTerm, status: statusFilter }
  );

  // create GRN draft from invoice
  const openGRNFromInvoice = (invoice: SupplierInvoiceDTO) => {
    const po = purchaseOrders.find((p) => p.id === invoice.poId);
    const poId = invoice.poId ?? po?.id;
    if (!poId) {
      console.error("Cannot create GRN: invoice is not linked to a PO.");
      return;
    }
    const draft: GoodsReceiptDTO = {
      id: `GRN-DRAFT-${Date.now()}`,
      grnNumber: `GRN-DRAFT-${Date.now()}`,
      poId,
      invoiceId: invoice.id,
      date: new Date().toISOString().slice(0, 10),
      status: "DRAFT",
      lines: (invoice.lines?.length ? invoice.lines : po?.items ?? []).map((ln: any) => ({
        productId: ln.productId,
        sku: ln.sku,
        name: ln.name,
        unit: ln.unit ?? ln.uom ?? "",
        receivedQty: ln.quantity ?? 0,
        unitPrice: ln.unitPrice,
      })),
    };
    setGrnDraft(draft);
    setShowGRNModal(true);
  };

  // context for Match tab
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
      goodsReceipts.find((g) => g.poId === poForMatch.id && g.invoiceId === invForMatch.id);
    return byInvoice ?? goodsReceipts.find((g) => g.poId === poForMatch.id);
  }, [poForMatch, invForMatch, goodsReceipts]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        {/* Header */}
        <div className="mb-6 rounded-2xl bg-white/90 p-6 shadow-card ring-1 ring-black/5 backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-ink-900 lg:text-4xl">
                Purchases &amp; Invoicing
              </h1>
              <p className="mt-2 text-base text-ink-400 lg:text-lg">
                POs, supplier invoices, goods receipts (GRN), and matching
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {/* Create A Purchase Order */}
              <CreatePODialog
                triggerClassName="inline-flex items-center gap-2 rounded-xl2 bg-blue-600 px-4 py-2.5 text-white shadow-card hover:shadow-cardHover"
              />
              <button className="inline-flex items-center gap-2 rounded-xl2 bg-emerald-600 px-4 py-2.5 text-white shadow-card transition-shadow hover:shadow-cardHover">
                <Upload className="h-4 w-4" /> Import Invoice
              </button>
              <button className="inline-flex items-center gap-2 rounded-xl2 border border-slate-200 bg-white px-4 py-2.5 text-ink-700 shadow-card transition-shadow hover:shadow-cardHover">
                <Download className="h-4 w-4" /> Export
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={<Package className="h-6 w-6 text-blue-600" />}
            label="Active Orders"
            value={purchaseOrders.length}
          />
          <Stat
            icon={<FileText className="h-6 w-6 text-amber-600" />}
            label="Pending Invoices"
            value={invoices.filter((i) => i.status === "PENDING").length}
          />
          <Stat
            icon={<Boxes className="h-6 w-6 text-violet-600" />}
            label="GRNs"
            value={goodsReceipts.length}
          />
          <Stat
            icon={<CheckCircle className="h-6 w-6 text-emerald-600" />}
            label="Total PO Spend"
            value={currency(purchaseOrders.reduce((s, p) => s + Number(p.total ?? 0), 0))}
          />
        </div>

        {/* Main card */}
        <div className="rounded-2xl bg-white/90 shadow-card ring-1 ring-black/5 backdrop-blur">
          {/* Tabs */}
          <Tabs active={activeTab} onChange={setActiveTab} />

          {/* Toolbar */}
          <div className="border-b border-slate-200 p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row">
              <div className="flex flex-1 gap-4">
                <div className="relative max-w-md flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={`Search ${activeTab}...`}
                    className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 outline-none ring-blue-500 transition focus:ring-2"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 px-3 py-2 outline-none ring-blue-500 transition focus:ring-2"
                >
                  {[
                    "all",
                    "draft",
                    "approved",
                    "sent",
                    "partially_received",
                    "received",
                    "pending",
                    "paid",
                    "overdue",
                    "posted",
                    "closed",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              <button className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-ink-700 transition hover:bg-slate-50">
                <Filter className="h-4 w-4" />
                More Filters
              </button>
            </div>
          </div>

          {/* Tables */}
          <div className="overflow-x-auto">
            {loading && <div className="p-6 text-slate-500">Loading {activeTab}…</div>}
            {errored && <div className="p-6 text-rose-600">Error loading {activeTab}.</div>}

            {!loading && !errored && activeTab === "purchases" && (
              <PurchaseTable data={filteredPOs} />
            )}

            {!loading && !errored && activeTab === "invoices" && (
              <InvoiceTable
                data={filteredInvoices}
                onCreateGRN={openGRNFromInvoice}
                onOpenMatch={(poId) => {
                  setActiveTab("match");
                  setMatchPOId(poId ?? null);
                }}
              />
            )}

            {!loading && !errored && activeTab === "grns" && (
              <GRNTable data={filteredGRNs} orders={purchaseOrders} invoices={invoices} />
            )}

            {!loading && !errored && activeTab === "match" && (
              <MatchTable
                po={poForMatch}
                invoice={invForMatch}
                grn={grnForMatch}
                allPOs={purchaseOrders}
                currentPOId={matchPOId}
                onChangePO={setMatchPOId}
              />
            )}
          </div>
        </div>
      </div>

      {/* GRN modal */}
      <CreateGRNModal
        open={showGRNModal}
        draft={grnDraft}
        onChange={setGrnDraft as any}
        onClose={() => setShowGRNModal(false)}
        onSaveDraft={() => setShowGRNModal(false)}
        onPost={() => setShowGRNModal(false)}
      />
    </div>
  );
}

/* --- small bits --- */
const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <div className="flex items-center rounded-2xl bg-white/90 p-6 shadow-card ring-1 ring-black/5 backdrop-blur">
    <div className="rounded-2xl bg-slate-50 p-3">{icon}</div>
    <div className="ml-4">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="text-2xl font-semibold text-ink-900">{value}</p>
    </div>
  </div>
);

function Tabs({
  active,
  onChange,
}: {
  active: string;
  onChange: (t: Tab) => void;
}) {
  const tabs = [
    { id: "purchases", label: "Purchase Orders", icon: Package },
    { id: "invoices", label: "Invoices", icon: FileText },
    { id: "grns", label: "Goods Receipts", icon: Boxes },
    { id: "match", label: "Match", icon: CheckCircle },
  ] as const;

  return (
    <div className="border-b border-slate-200">
      <nav className="flex space-x-8 px-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id as Tab)}
            className={`py-4 px-1 text-sm font-medium transition-colors ${
              active === id
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-slate-500 hover:border-b-2 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            <Icon className="mr-2 inline h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
