// File: components/InventoryPDFDownload.tsx
"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


export type InventoryItem = {
  name: string;
  category: string;
  quantity: number;
  unit?: string;
  expiryDate?: string;
  status?: string;
  supplier?: string;
  id?: string;
};

type InventoryPDFDownloadProps = {
  items: InventoryItem[];
  organizationName?: string;
  department?: string;
  preparedBy?: string;
  approvedBy?: string;
  reportType?: "full" | "low-stock" | "expired";
  notes?: string;
};

export default function InventoryPDFDownload({
  items,
  organizationName = "Laboratory Services and Consultation Limited",
  department = "Medical Laboratory Services",
  preparedBy = "Hunter",
  approvedBy,
  reportType = "full",
  notes,
}: InventoryPDFDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);

    
  
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Colors
      const primaryBlue: [number, number, number] = [37, 99, 235];   // #2563eb
      const darkGray:    [number, number, number] = [30, 41, 59];    // #1e293b
      const lightGray:   [number, number, number] = [100, 116, 139]; // #64748b


      // Try to add logo
      try {
        const logoImg = await loadImage("/logo.png");
        doc.addImage(logoImg, "PNG", 15, 15, 20, 20);
      } catch (error) {
        console.log("Logo not found, continuing without it");
      }

      // Header - Organization Name
      doc.setFontSize(16);
      doc.setTextColor(...darkGray);
      doc.setFont("helvetica", "bold");
      doc.text(organizationName, 40, 22);

      // Department
      doc.setFontSize(10);
      doc.setTextColor(...lightGray);
      doc.setFont("helvetica", "normal");
      doc.text(department, 40, 28);

      // Blue line
      doc.setDrawColor(...primaryBlue);
      doc.setLineWidth(1);
      doc.line(15, 38, pageWidth - 15, 38);

      // Report Title
      doc.setFontSize(20);
      doc.setTextColor(...darkGray);
      doc.setFont("helvetica", "bold");
      const reportTitle = getReportTitle(reportType);
      doc.text(reportTitle, 15, 48);

      // Subtitle
      doc.setFontSize(9);
      doc.setTextColor(...lightGray);
      doc.setFont("helvetica", "italic");
      doc.text("Complete inventory tracking and management overview", 15, 54);

      // Metadata Box
      const metadataY = 62;
      doc.setFillColor(248, 250, 252);
      doc.rect(15, metadataY, pageWidth - 30, 18, "F");
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, metadataY, pageWidth - 30, 18);

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
      doc.text("GENERATED DATE", 20, metadataY + 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...darkGray);
      doc.text(generatedAt, 20, metadataY + 10);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...lightGray);
      doc.text("TIME", 75, metadataY + 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...darkGray);
      doc.text(generatedTime, 75, metadataY + 10);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...lightGray);
      doc.text("PREPARED BY", 115, metadataY + 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...darkGray);
      doc.text(preparedBy, 115, metadataY + 10);

      if (approvedBy) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(...lightGray);
        doc.text("APPROVED BY", 155, metadataY + 5);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(...darkGray);
        doc.text(approvedBy, 155, metadataY + 10);
      }

      // Calculate statistics
      const totalItems = items.length;
      const lowStockItems = items.filter(
        (item) => item.status?.toLowerCase() === "low stock"
      ).length;
      const criticalItems = items.filter(
        (item) => item.status?.toLowerCase() === "critical"
      ).length;
      const expiredItems = items.filter((item) => isExpired(item.expiryDate)).length;
      const inStockItems = items.filter(
        (item) => item.status?.toLowerCase() === "in stock"
      ).length;

      // Summary Cards
      const summaryY = 88;
      const cardWidth = (pageWidth - 45) / 4;

      drawSummaryCard(
        doc,
        15,
        summaryY,
        cardWidth,
        "Total Items",
        totalItems.toString(),
        "#dbeafe",
        "#2563eb"
      );
      drawSummaryCard(
        doc,
        15 + cardWidth + 5,
        summaryY,
        cardWidth,
        "In Stock",
        inStockItems.toString(),
        "#d1fae5",
        "#10b981"
      );
      drawSummaryCard(
        doc,
        15 + (cardWidth + 5) * 2,
        summaryY,
        cardWidth,
        "Low Stock",
        lowStockItems.toString(),
        "#fef3c7",
        "#f59e0b"
      );
      drawSummaryCard(
        doc,
        15 + (cardWidth + 5) * 3,
        summaryY,
        cardWidth,
        "Critical",
        criticalItems.toString(),
        "#fee2e2",
        "#ef4444"
      );

      // Table
      const tableData = items.map((item) => [
        item.name,
        item.category,
        `${item.quantity} ${item.unit || "pcs"}`,
        formatExpiryDate(item.expiryDate),
        item.status || "In stock",
      ]);

      autoTable(doc, {
        startY: 110,
        head: [["Item Name", "Category", "Quantity", "Expiry Date", "Status"]],
        body: tableData,
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
          0: { cellWidth: 50 },
          1: { cellWidth: 35 },
          2: { cellWidth: 30, halign: "right" },
          3: { cellWidth: 30 },
          4: { cellWidth: 35 },
        },
        didParseCell: function (data) {
          if (data.column.index === 3 && data.section === "body") {
            const expiryDate = items[data.row.index].expiryDate;
            if (isExpired(expiryDate)) {
              data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fontStyle = "bold";
            } else if (isExpiringSoon(expiryDate)) {
              data.cell.styles.textColor = [245, 158, 11];
              data.cell.styles.fontStyle = "bold";
            }
          }

          if (data.column.index === 4 && data.section === "body") {
            const status = items[data.row.index].status?.toLowerCase();
            if (status === "critical") {
              data.cell.styles.textColor = [153, 27, 27];
              data.cell.styles.fillColor = [254, 226, 226];
              data.cell.styles.fontStyle = "bold";
            } else if (status === "low stock") {
              data.cell.styles.textColor = [146, 64, 14];
              data.cell.styles.fillColor = [254, 243, 199];
              data.cell.styles.fontStyle = "bold";
            } else if (status === "in stock") {
              data.cell.styles.textColor = [6, 95, 70];
              data.cell.styles.fillColor = [209, 250, 229];
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
      });

      // Notes
      if (notes) {
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        if (finalY < pageHeight - 40) {
          doc.setFillColor(255, 251, 235);
          doc.rect(15, finalY, pageWidth - 30, 20, "F");
          doc.setDrawColor(245, 158, 11);
          doc.setLineWidth(2);
          doc.line(15, finalY, 15, finalY + 20);

          doc.setFontSize(8);
          doc.setTextColor(146, 64, 14);
          doc.setFont("helvetica", "bold");
          doc.text("IMPORTANT NOTES", 20, finalY + 6);

          doc.setFontSize(8);
          doc.setTextColor(120, 53, 15);
          doc.setFont("helvetica", "normal");
          const splitNotes = doc.splitTextToSize(notes, pageWidth - 40);
          doc.text(splitNotes, 20, finalY + 12);
        }
      }

      // Footer
      const footerY = pageHeight - 15;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);

      doc.setFontSize(7);
      doc.setTextColor(...lightGray);
      doc.setFont("helvetica", "normal");
      doc.text(`Document ID: INV-${Date.now().toString().slice(-8)}`, 15, footerY);
      doc.text(
        `Report Type: ${reportType.toUpperCase()}`,
        pageWidth / 2,
        footerY,
        { align: "center" }
      );
      doc.text("Page 1", pageWidth - 15, footerY, { align: "right" });

      // Save
      doc.save(`Lab-Services-Inventory-${Date.now()}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={generatePDF}
      disabled={isGenerating || items.length === 0}
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
          Download PDF Report
        </>
      )}
    </button>
  );
}

// Helper Functions
function drawSummaryCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  bgColor: string,
  borderColor: string
) {
  const bg = hexToRgb(bgColor);
  const border = hexToRgb(borderColor);

  doc.setFillColor(bg.r, bg.g, bg.b);
  doc.rect(x, y, width, 16, "F");
  doc.setDrawColor(border.r, border.g, border.b);
  doc.setLineWidth(0.5);
  doc.rect(x, y, width, 16);

  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "bold");
  doc.text(label.toUpperCase(), x + 3, y + 5);

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(value, x + 3, y + 12);
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function getReportTitle(reportType: string): string {
  switch (reportType) {
    case "low-stock":
      return "Low Stock Alert Report";
    case "expired":
      return "Expired Items Report";
    default:
      return "Comprehensive Inventory Report";
  }
}

function formatExpiryDate(dateString?: string): string {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

function isExpired(dateString?: string): boolean {
  if (!dateString) return false;
  try {
    const expiry = new Date(dateString);
    return expiry < new Date();
  } catch {
    return false;
  }
}

function isExpiringSoon(dateString?: string): boolean {
  if (!dateString) return false;
  try {
    const expiry = new Date(dateString);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expiry < thirtyDaysFromNow && expiry >= new Date();
  } catch {
    return false;
  }
}

function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}