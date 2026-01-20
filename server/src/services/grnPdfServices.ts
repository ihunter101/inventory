// src/services/grnPdfServices.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type LineItem = {
  name: string;
  quantity: number;
  unitPrice: number; // keep for compatibility (can be 0 on GRN)
  total: number;
  unit: string;
};

export interface GoodsReceiptPDFData {
  documentType: "GRN";
  title: string;
  documentNumber: string;

  preparedBy: string;
  organizationName: string;
  departmentName?: string;

  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;

  receivedDate?: string;
  reference?: string; // optional field if you want (e.g., PO# / Invoice#)

  items: LineItem[];

  subtotal?: number;
  tax?: number;
  total?: number;

  notes?: string;
  approvedBy?: string;

  logoDataUrl?: string;
}

export function generateGoodsReceiptPDFBuffer(data: GoodsReceiptPDFData): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const primaryBlue: [number, number, number] = [37, 99, 235];
  const darkGray: [number, number, number] = [30, 41, 59];
  const lightGray: [number, number, number] = [100, 116, 139];

  // Logo
  if (data.logoDataUrl) {
    try {
      doc.addImage(data.logoDataUrl, "PNG", 15, 15, 20, 20);
    } catch {
      // ignore
    }
  }

  // Org name
  doc.setFontSize(16);
  doc.setTextColor(...darkGray);
  doc.setFont("helvetica", "bold");
  doc.text(data.organizationName, 40, 22);

  if (data.departmentName) {
    doc.setFontSize(10);
    doc.setTextColor(...lightGray);
    doc.setFont("helvetica", "normal");
    doc.text(data.departmentName, 40, 28);
  }

  // Divider
  doc.setDrawColor(...primaryBlue);
  doc.setLineWidth(1);
  doc.line(15, 38, pageWidth - 15, 38);

  // Title
  doc.setFontSize(20);
  doc.setTextColor(...darkGray);
  doc.setFont("helvetica", "bold");
  doc.text(data.title, 15, 48);

  // Document number
  doc.setFontSize(9);
  doc.setTextColor(...lightGray);
  doc.setFont("helvetica", "italic");
  doc.text(`#${data.documentNumber}`, 15, 54);

  // Metadata box
  const metadataY = 62;
  doc.setFillColor(248, 250, 252);
  doc.rect(15, metadataY, pageWidth - 30, 18, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, metadataY, pageWidth - 30, 18);

  // Received Date
  doc.setFontSize(7);
  doc.setTextColor(...lightGray);
  doc.setFont("helvetica", "bold");
  doc.text("RECEIVED DATE", 20, metadataY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...darkGray);
  doc.text(data.receivedDate || new Date().toLocaleDateString(), 20, metadataY + 10);

  // Reference (optional)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...lightGray);
  doc.text("REFERENCE", 70, metadataY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...darkGray);
  doc.text(data.reference || "N/A", 70, metadataY + 10);

  // Prepared By
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...lightGray);
  doc.text("PREPARED BY", 130, metadataY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...darkGray);
  doc.text(data.preparedBy, 130, metadataY + 10);

  // Approved By (optional)
  if (data.approvedBy) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...lightGray);
    doc.text("APPROVED BY", 170, metadataY + 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...darkGray);
    doc.text(data.approvedBy, 170, metadataY + 10);
  }

  // Supplier section
  const supplierY = 88;
  doc.setFontSize(10);
  doc.setTextColor(...darkGray);
  doc.setFont("helvetica", "bold");
  doc.text("SUPPLIER INFORMATION", 15, supplierY);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...darkGray);
  doc.text(data.supplierName, 15, supplierY + 8);

  if (data.supplierEmail) doc.setFontSize(8), doc.text(`Email: ${data.supplierEmail}`, 15, supplierY + 13);
  if (data.supplierPhone) doc.setFontSize(8), doc.text(`Phone: ${data.supplierPhone}`, 15, supplierY + 17);

  // Table
  const tableData = data.items.map((item) => [
    item.name,
    `${item.quantity} ${item.unit || "pcs"}`,
    `$${Number(item.unitPrice).toFixed(2)}`,
    `$${Number(item.total).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: supplierY + 25,
    head: [["PRODUCT NAME", "RECEIVED QTY", "UNIT PRICE", "TOTAL"]],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: darkGray,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
      halign: "left",
      valign: "middle",
      lineColor: primaryBlue,
      lineWidth: 0.5,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: darkGray,
      lineColor: [226, 232, 240],
      lineWidth: 0.3,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 70, halign: "left" },
      1: { cellWidth: 35, halign: "center" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
    },
    margin: { left: 15, right: 15 },
  });

  // Totals
  const tableEndY = (doc as any).lastAutoTable.finalY;
  const totalsY = tableEndY + 8;
  const totalsBoxX = pageWidth - 70;

  const computedSubtotal =
    data.subtotal ?? data.items.reduce((sum, item) => sum + item.total, 0);
  const tax = data.tax ?? 0;
  const total = data.total ?? computedSubtotal + tax;

  doc.setFontSize(9);
  doc.setTextColor(...lightGray);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal:", totalsBoxX, totalsY);
  doc.setTextColor(...darkGray);
  doc.setFont("helvetica", "bold");
  doc.text(`$${computedSubtotal.toFixed(2)}`, pageWidth - 15, totalsY, { align: "right" });

  if (tax > 0) {
    doc.setTextColor(...lightGray);
    doc.setFont("helvetica", "normal");
    doc.text("Tax:", totalsBoxX, totalsY + 8);
    doc.setTextColor(...darkGray);
    doc.setFont("helvetica", "bold");
    doc.text(`$${tax.toFixed(2)}`, pageWidth - 15, totalsY + 8, { align: "right" });
  }

  doc.setDrawColor(...primaryBlue);
  doc.setLineWidth(0.8);
  doc.line(totalsBoxX - 5, totalsY + 14, pageWidth - 5, totalsY + 14);

  doc.setFontSize(12);
  doc.setTextColor(...primaryBlue);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", totalsBoxX, totalsY + 22);
  doc.setFontSize(14);
  doc.text(`$${total.toFixed(2)}`, pageWidth - 15, totalsY + 22, { align: "right" });

  // Notes
  if (data.notes) {
    const notesY = totalsY + 32;
    if (notesY < pageHeight - 40) {
      doc.setFillColor(255, 251, 235);
      doc.rect(15, notesY, pageWidth - 30, 20, "F");
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(2);
      doc.line(15, notesY, 15, notesY + 20);

      doc.setFontSize(8);
      doc.setTextColor(146, 64, 14);
      doc.setFont("helvetica", "bold");
      doc.text("SPECIAL NOTES", 20, notesY + 6);

      doc.setFontSize(8);
      doc.setTextColor(120, 53, 15);
      doc.setFont("helvetica", "normal");
      const splitNotes = doc.splitTextToSize(data.notes, pageWidth - 40);
      doc.text(splitNotes, 20, notesY + 12);
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
  doc.text(`Document ID: GRN-${Date.now().toString().slice(-8)}`, 15, footerY);
  doc.text("GOODS RECEIPT NOTE", pageWidth / 2, footerY, { align: "center" });
  doc.text("Page 1", pageWidth - 15, footerY, { align: "right" });

  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
