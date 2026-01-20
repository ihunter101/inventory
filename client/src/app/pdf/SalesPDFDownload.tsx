"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { Sales } from "@/app/state/api";

const LOCATION_NAMES: Record<number, string> = {
  1: "Tapion",
  2: "Blue Coral",
  3: "Manoel Street",
  4: "Sunny Acres",
  5: "Em Care",
  6: "Rodney Bay",
  7: "Member Care",
  8: "Vieux Fort",
  9: "Soufriere",
  10: "Other",
};

type SalesPDFDownloadProps = {
  sales: Sales[];
  dateRangeLabel?: string; // e.g. "1M", "3M"
  selectedLocationLabel?: string; // e.g. "All Locations" or "Tapion"
  organizationName?: string;
  department?: string;
  preparedBy?: string;
  notes?: string;

  // If you want the big KPI numbers shown in the PDF header:
  totals?: {
    totalSales: number;
    totalCash: number;
    totalCard: number;
  };
};

export default function SalesPDFDownload({
  sales,
  dateRangeLabel = "1M",
  selectedLocationLabel = "All Locations",
  organizationName = "Laboratory Services and Consultation Limited",
  department = "Medical Laboratory Services",
  preparedBy = "Hunter",
  notes,
  totals,
}: SalesPDFDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "XCD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const safeTotals = useMemo(() => {
    // If totals weren't provided, calculate a conservative version from rows.
    if (totals) return totals;

    const agg = sales.reduce(
      (acc, s) => {
        const cash = Number(s.cashTotal || 0);
        const card = Number(s.creditCardTotal || 0) + Number(s.debitCardTotal || 0);
        const total = Number(s.grandTotal || 0);
        acc.totalCash += cash;
        acc.totalCard += card;
        acc.totalSales += total;
        return acc;
      },
      { totalSales: 0, totalCash: 0, totalCard: 0 }
    );

    return agg;
  }, [sales, totals]);

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      const doc = new jsPDF({ orientation: "landscape" }); // sales table is wide
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Brand colors (keep close to your inventory PDF)
      const primaryBlue: [number, number, number] = [37, 99, 235];
      const darkGray: [number, number, number] = [30, 41, 59];
      const lightGray: [number, number, number] = [100, 116, 139];

      // Header
      doc.setFontSize(16);
      doc.setTextColor(...darkGray);
      doc.setFont("helvetica", "bold");
      doc.text(organizationName, 15, 15);

      doc.setFontSize(10);
      doc.setTextColor(...lightGray);
      doc.setFont("helvetica", "normal");
      doc.text(department, 15, 21);

      // Divider
      doc.setDrawColor(...primaryBlue);
      doc.setLineWidth(1);
      doc.line(15, 26, pageWidth - 15, 26);

      // Title
      doc.setFontSize(18);
      doc.setTextColor(...darkGray);
      doc.setFont("helvetica", "bold");
      doc.text("Sales Analytics — Sales Details", 15, 38);

      // Metadata box
      const metadataY = 44;
      doc.setFillColor(248, 250, 252);
      doc.rect(15, metadataY, pageWidth - 30, 16, "F");
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, metadataY, pageWidth - 30, 16);

      const generatedAt = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const generatedTime = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      doc.setFontSize(7);
      doc.setTextColor(...lightGray);
      doc.setFont("helvetica", "bold");
      doc.text("GENERATED", 20, metadataY + 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...darkGray);
      doc.text(`${generatedAt} • ${generatedTime}`, 20, metadataY + 11);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...lightGray);
      doc.text("FILTERS", 95, metadataY + 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...darkGray);
      doc.text(
        `Range: ${dateRangeLabel} • Location: ${selectedLocationLabel}`,
        95,
        metadataY + 11
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...lightGray);
      doc.text("PREPARED BY", pageWidth - 70, metadataY + 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...darkGray);
      doc.text(preparedBy, pageWidth - 70, metadataY + 11);

      // KPI row
      const kpiY = 66;
      const cardW = (pageWidth - 30 - 10) / 3; // 3 cards + gaps

      drawKpi(doc, 15, kpiY, cardW, "Total Sales", formatCurrency(safeTotals.totalSales), [219, 234, 254]);
      drawKpi(doc, 15 + cardW + 5, kpiY, cardW, "Cash Sales", formatCurrency(safeTotals.totalCash), [209, 250, 229]);
      drawKpi(doc, 15 + (cardW + 5) * 2, kpiY, cardW, "Card Sales", formatCurrency(safeTotals.totalCard), [237, 233, 254]);

      // Table data
      const body = sales.map((s) => [
        new Date(s.salesDate).toLocaleDateString(),
        LOCATION_NAMES[s.locationId] ?? `Location ${s.locationId}`,
        formatCurrency(Number(s.cashTotal || 0)),
        formatCurrency(Number(s.creditCardTotal || 0)),
        formatCurrency(Number(s.debitCardTotal || 0)),
        formatCurrency(Number(s.chequeTotal || 0)),
        formatCurrency(Number(s.grandTotal || 0)),
        s.enteredBy ?? "",
      ]);

      autoTable(doc, {
        startY: 90,
        head: [[
          "Date",
          "Location",
          "Cash",
          "Credit Card",
          "Debit Card",
          "Cheque",
          "Total",
          "Entered By",
        ]],
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
          0: { cellWidth: 28 }, // Date
          1: { cellWidth: 40 }, // Location
          2: { cellWidth: 28, halign: "right" },
          3: { cellWidth: 32, halign: "right" },
          4: { cellWidth: 32, halign: "right" },
          5: { cellWidth: 28, halign: "right" },
          6: { cellWidth: 30, halign: "right" },
          7: { cellWidth: 45 }, // Entered By
        },
        didParseCell: (data) => {
          // Make "Total" column bold
          if (data.section === "body" && data.column.index === 6) {
            data.cell.styles.fontStyle = "bold";
          }
        },
        margin: { left: 15, right: 15 },
      });

      // Notes (optional)
      if (notes) {
        const lastY = (doc as any).lastAutoTable?.finalY ?? 90;
        const y = Math.min(lastY + 8, pageHeight - 28);

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

        doc.text(`Document ID: SALES-${Date.now().toString().slice(-8)}`, 15, footerY);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, footerY, { align: "right" });
      }

      doc.save(`Sales-Details-${Date.now()}.pdf`);
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
      disabled={isGenerating || sales.length === 0}
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

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(value, x + 4, y + 12);
}
