"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type PdfSummaryCard = {
  label: string;
  value: string;
  bgHex?: string;
  borderHex?: string;
};

export type PdfMetaField = {
  label: string;
  value: string;
};

export type PdfTable = {
  head: string[];
  body: (string | number)[][];
  columnStyles?: Record<number, any>;
};

export type PdfReportConfig = {
  // header
  organizationName: string;
  department?: string;
  logoUrl?: string;

  // title area
  title: string;
  subtitle?: string;

  // meta + summary
  meta?: PdfMetaField[];
  summaryCards?: PdfSummaryCard[];

  // main table
  table: PdfTable;

  // extra
  notes?: string;
  filename: string;
};

export async function generatePdfReport(cfg: PdfReportConfig) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const primaryBlue: [number, number, number] = [37, 99, 235];
  const darkGray: [number, number, number] = [30, 41, 59];
  const lightGray: [number, number, number] = [100, 116, 139];

  // Logo (optional)
  if (cfg.logoUrl) {
    try {
      const logoImg = await loadImage(cfg.logoUrl);
      doc.addImage(logoImg, "PNG", 15, 15, 20, 20);
    } catch {
      // ignore
    }
  }

  // Header text
  doc.setFontSize(16);
  doc.setTextColor(...darkGray);
  doc.setFont("helvetica", "bold");
  doc.text(cfg.organizationName, 40, 22);

  if (cfg.department) {
    doc.setFontSize(10);
    doc.setTextColor(...lightGray);
    doc.setFont("helvetica", "normal");
    doc.text(cfg.department, 40, 28);
  }

  // Divider
  doc.setDrawColor(...primaryBlue);
  doc.setLineWidth(1);
  doc.line(15, 38, pageWidth - 15, 38);

  // Title
  doc.setFontSize(20);
  doc.setTextColor(...darkGray);
  doc.setFont("helvetica", "bold");
  doc.text(cfg.title, 15, 50);

  if (cfg.subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(...lightGray);
    doc.setFont("helvetica", "italic");
    doc.text(cfg.subtitle, 15, 56);
  }

  // Metadata box (optional)
  let cursorY = 62;

  if (cfg.meta?.length) {
    doc.setFillColor(248, 250, 252);
    doc.rect(15, cursorY, pageWidth - 30, 18, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, cursorY, pageWidth - 30, 18);

    const startX = 20;
    const colWidth = (pageWidth - 40) / Math.min(cfg.meta.length, 4);

    cfg.meta.slice(0, 4).forEach((m, i) => {
      const x = startX + i * colWidth;
      doc.setFontSize(7);
      doc.setTextColor(...lightGray);
      doc.setFont("helvetica", "bold");
      doc.text(m.label.toUpperCase(), x, cursorY + 5);

      doc.setFontSize(9);
      doc.setTextColor(...darkGray);
      doc.setFont("helvetica", "normal");
      doc.text(String(m.value), x, cursorY + 10);
    });

    cursorY += 26;
  } else {
    cursorY += 6;
  }

  // Summary cards (optional)
  if (cfg.summaryCards?.length) {
    const cards = cfg.summaryCards.slice(0, 4);
    const cardWidth = (pageWidth - 45) / cards.length;

    cards.forEach((c, i) => {
      const x = 15 + i * (cardWidth + 5);
      drawSummaryCard(doc, x, cursorY, cardWidth, c.label, c.value, c.bgHex, c.borderHex);
    });

    cursorY += 24;
  }

  // Table
  autoTable(doc, {
    startY: cursorY,
    head: [cfg.table.head],
    body: cfg.table.body,
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
    columnStyles: cfg.table.columnStyles ?? {},
  });

  // Notes (optional)
  if (cfg.notes?.trim()) {
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const safeY = Math.min(finalY, pageHeight - 45);

    doc.setFontSize(8);
    doc.setTextColor(146, 64, 14);
    doc.setFont("helvetica", "bold");
    doc.text("NOTES", 15, safeY);

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    const split = doc.splitTextToSize(cfg.notes, pageWidth - 30);
    doc.text(split, 15, safeY + 6);
  }

  doc.save(cfg.filename);
}

function drawSummaryCard(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
  bgHex?: string,
  borderHex?: string
) {
  const bg = hexToRgb(bgHex ?? "#f1f5f9");
  const border = hexToRgb(borderHex ?? "#cbd5e1");

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
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 };
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
