"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { StockRequestDetailResponse, StockRequestLineDetail } from "@/app/state/stockSheetSlice";

type Props = {
  request: StockRequestDetailResponse;

  // If you want the PDF to reflect your *edited* review state (linesState, message, expectedDeliveryAt),
  // pass these overrides. Otherwise it uses request.lines / request.messageToRequester / request.expectedDeliveryAt.
  linesOverride?: Array<Pick<StockRequestLineDetail, "id" | "grantedQty" | "outcome">>;
  messageOverride?: string;
  expectedDeliveryOverride?: string; // ISO string OR datetime-local string

  organizationName?: string;
  department?: string;
  preparedBy?: string;
  notes?: string;
};

export default function StockRequestPDFDownload({
  request,
  linesOverride,
  messageOverride,
  expectedDeliveryOverride,
  organizationName = "Laboratory Services and Consultation Limited",
  department = "Medical Laboratory Services",
  preparedBy = "Hunter",
  notes,
}: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  const computed = useMemo(() => {
    // Merge overrides into request lines if provided (so PDF matches UI edits).
    const lines = request.lines.map((l) => {
      const ov = linesOverride?.find((x) => x.id === l.id);
      return ov
        ? { ...l, grantedQty: ov.grantedQty ?? l.grantedQty, outcome: ov.outcome ?? l.outcome }
        : l;
    });

    const totalRequested = lines.reduce((sum, l) => sum + (Number(l.requestedQty) || 0), 0);
    const totalGranted = lines.reduce((sum, l) => sum + (Number(l.grantedQty) || 0), 0);

    const unavailableCount = lines.filter((l) => l.outcome === "UNAVAILABLE" || (l.availableQty ?? 0) === 0).length;
    const adjustedCount = lines.filter((l) => l.outcome === "ADJUSTED").length;

    const expectedDelivery = normalizeDateLabel(expectedDeliveryOverride ?? request.expectedDeliveryAt);
    const messageToRequester = (messageOverride ?? request.messageToRequester ?? "").trim();

    return { lines, totalRequested, totalGranted, unavailableCount, adjustedCount, expectedDelivery, messageToRequester };
  }, [request, linesOverride, messageOverride, expectedDeliveryOverride]);

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      const doc = new jsPDF({ orientation: "portrait" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Palette (aligned with your other PDFs)
      const primaryBlue: [number, number, number] = [37, 99, 235];
      const darkGray: [number, number, number] = [30, 41, 59];
      const lightGray: [number, number, number] = [100, 116, 139];

      // Header
      doc.setFontSize(16);
      doc.setTextColor(...darkGray);
      doc.setFont("helvetica", "bold");
      doc.text(organizationName, 15, 16);

      doc.setFontSize(10);
      doc.setTextColor(...lightGray);
      doc.setFont("helvetica", "normal");
      doc.text(department, 15, 22);

      doc.setDrawColor(...primaryBlue);
      doc.setLineWidth(1);
      doc.line(15, 28, pageWidth - 15, 28);

      doc.setFontSize(18);
      doc.setTextColor(...darkGray);
      doc.setFont("helvetica", "bold");
      doc.text("Stock Request Sheet", 15, 40);

      // Metadata box
      const metaY = 46;
      doc.setFillColor(248, 250, 252);
      doc.rect(15, metaY, pageWidth - 30, 26, "F");
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, metaY, pageWidth - 30, 26);

      const generatedAt = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const generatedTime = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

      writeKV(doc, 20, metaY + 7, "Request ID", request.id, darkGray, lightGray);
      writeKV(doc, 20, metaY + 15, "Status", request.status.replace(/_/g, " "), darkGray, lightGray);

      writeKV(doc, 95, metaY + 7, "Generated", `${generatedAt} • ${generatedTime}`, darkGray, lightGray);
      writeKV(doc, 95, metaY + 15, "Prepared By", preparedBy, darkGray, lightGray);

      // Requester section
      const reqY = 78;
      doc.setFontSize(11);
      doc.setTextColor(...darkGray);
      doc.setFont("helvetica", "bold");
      doc.text("Requester Details", 15, reqY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...darkGray);
      doc.text(`Name: ${request.requestedByName}`, 15, reqY + 7);
      doc.text(`Email: ${request.requestedByEmail}`, 15, reqY + 13);
      doc.text(`Location: ${String(request.requestedByLocation)}`, 15, reqY + 19);

      doc.text(
        `Submitted: ${new Date(request.submittedAt).toLocaleString()}`,
        15,
        reqY + 25
      );

      // Review section
      const reviewY = reqY + 35;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Review / Fulfillment Notes", 15, reviewY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Expected Delivery: ${computed.expectedDelivery || "N/A"}`, 15, reviewY + 7);

      const msg = computed.messageToRequester || "N/A";
      const msgLines = doc.splitTextToSize(`Message: ${msg}`, pageWidth - 30);
      doc.text(msgLines, 15, reviewY + 13);

      // KPI strip
      const kpiY = reviewY + 28 + (msgLines.length > 1 ? (msgLines.length - 1) * 4 : 0);
      const cardW = (pageWidth - 30 - 10) / 3;

      drawKpi(doc, 15, kpiY, cardW, "Lines", String(computed.lines.length), [219, 234, 254]);
      drawKpi(doc, 15 + cardW + 5, kpiY, cardW, "Requested Qty", String(computed.totalRequested), [209, 250, 229]);
      drawKpi(doc, 15 + (cardW + 5) * 2, kpiY, cardW, "Granted Qty", String(computed.totalGranted), [237, 233, 254]);

      const kpi2Y = kpiY + 20;
      drawKpi(doc, 15, kpi2Y, cardW, "Unavailable", String(computed.unavailableCount), [254, 226, 226]);
      drawKpi(doc, 15 + cardW + 5, kpi2Y, cardW, "Adjusted", String(computed.adjustedCount), [254, 243, 199]);
      drawKpi(doc, 15 + (cardW + 5) * 2, kpi2Y, cardW, "Ok/Granted", String(computed.lines.length - computed.unavailableCount - computed.adjustedCount), [209, 250, 229]);

      // Lines table
      const startTableY = kpi2Y + 22;

      const body = computed.lines.map((l) => [
        l.productName,
        l.unit ?? "N/A",
        l.department ?? "N/A",
        String(l.availableQty ?? 0),
        String(l.requestedQty ?? 0),
        String(l.grantedQty ?? 0),
        l.outcome,
      ]);

      autoTable(doc, {
        startY: startTableY,
        head: [["Product", "Unit", "Dept", "Avail", "Req", "Grant", "Outcome"]],
        body,
        theme: "grid",
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontSize: 9,
          fontStyle: "bold",
          halign: "left",
        },
        bodyStyles: {
          fontSize: 9,
          textColor: [30, 41, 59],
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 62 }, // Product
          1: { cellWidth: 18, halign: "center" },
          2: { cellWidth: 22 },
          3: { cellWidth: 15, halign: "center" },
          4: { cellWidth: 14, halign: "center" },
          5: { cellWidth: 16, halign: "center" },
          6: { cellWidth: 22, halign: "center" },
        },
        margin: { left: 15, right: 15 },
        didParseCell: (data) => {
          // Style outcome column
          if (data.section === "body" && data.column.index === 6) {
            const outcome = String(data.cell.raw || "").toUpperCase();
            if (outcome === "UNAVAILABLE") {
              data.cell.styles.textColor = [153, 27, 27];
              data.cell.styles.fillColor = [254, 226, 226];
              data.cell.styles.fontStyle = "bold";
            } else if (outcome === "ADJUSTED") {
              data.cell.styles.textColor = [146, 64, 14];
              data.cell.styles.fillColor = [254, 243, 199];
              data.cell.styles.fontStyle = "bold";
            } else if (outcome === "GRANTED") {
              data.cell.styles.textColor = [6, 95, 70];
              data.cell.styles.fillColor = [209, 250, 229];
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
      });

      // Notes (optional)
      const lastY = (doc as any).lastAutoTable?.finalY ?? startTableY;
      if (notes) {
        const y = Math.min(lastY + 8, pageHeight - 26);
        doc.setFillColor(255, 251, 235);
        doc.rect(15, y, pageWidth - 30, 16, "F");
        doc.setDrawColor(245, 158, 11);
        doc.setLineWidth(1);
        doc.line(15, y, 15, y + 16);

        doc.setFontSize(8);
        doc.setTextColor(146, 64, 14);
        doc.setFont("helvetica", "bold");
        doc.text("NOTES", 20, y + 6);

        doc.setFontSize(8);
        doc.setTextColor(120, 53, 15);
        doc.setFont("helvetica", "normal");
        const split = doc.splitTextToSize(notes, pageWidth - 45);
        doc.text(split, 20, y + 12);
      }

      // Footer + page numbers
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const footerY = pageHeight - 10;

        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.5);
        doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);

        doc.setFontSize(7);
        doc.setTextColor(...lightGray);
        doc.setFont("helvetica", "normal");

        doc.text(`Document ID: SR-${request.id.slice(-8).toUpperCase()}-${Date.now().toString().slice(-6)}`, 15, footerY);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, footerY, { align: "right" });
      }

      doc.save(`Stock-Request-${request.id}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={isGenerating || !request?.id}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {isGenerating ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          Generating...
        </>
      ) : (
        <>
          <Download size={18} />
          Download PDF
        </>
      )}
    </button>
  );
}

/** Helpers */

function writeKV(
  doc: jsPDF,
  x: number,
  y: number,
  key: string,
  value: string,
  dark: [number, number, number],
  light: [number, number, number]
) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...light);
  doc.text(key.toUpperCase(), x, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...dark);
  doc.text(value || "N/A", x, y + 5);
}

function drawKpi(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  label: string,
  value: string,
  bg: [number, number, number]
) {
  doc.setFillColor(...bg);
  doc.rect(x, y, w, 16, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(x, y, w, 16);

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "bold");
  doc.text(label.toUpperCase(), x + 4, y + 5);

  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(value, x + 4, y + 12);
}

function normalizeDateLabel(raw?: string | null) {
  if (!raw) return "";
  try {
    // Handles ISO strings and "YYYY-MM-DDTHH:mm" datetime-local
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    return d.toLocaleString();
  } catch {
    return raw;
  }
}
