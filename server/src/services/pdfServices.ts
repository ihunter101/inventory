import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ===== SHARED TYPES (same shape as your fancy version) =====
export type LineItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  unit: string;
};

export interface PurchaseOrderPDFData {
  documentType: "PO";
  title: string;
  documentNumber: string;
  preparedBy: string;
  organizationName: string;
  departmentName?: string;
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  orderDate?: string;
  expectedDeliveryDate: string;
  items: LineItem[];
  subtotal?: number;
  tax?: number;
  total?: number;
  notes?: string;
  approvedBy?: string;
  // optional: if you ever want a logo in Node, pass a dataURL/base64 string here
  logoDataUrl?: string;
}

/**
 * Professional Purchase Order PDF Generator (Node version)
 * - Matches your inventory PDF styling
 * - Returns a Buffer instead of saving directly
 */
export function generatePurchaseOrderPDFBuffer(
  data: PurchaseOrderPDFData
): Buffer {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // ===== COLOR SCHEME =====
  const primaryBlue: [number, number, number] = [37, 99, 235]; // #2563eb
  const darkGray: [number, number, number] = [30, 41, 59]; // #1e293b
  const lightGray: [number, number, number] = [100, 116, 139]; // #64748b

  // ===== HEADER SECTION =====
  // Optional logo if you pass a dataURL from outside (Node can't use <img/>)
  if (data.logoDataUrl) {
    try {
      doc.addImage(data.logoDataUrl, "PNG", 15, 15, 20, 20);
    } catch {
      // If logo fails, just continue without it
    }
  }

  // Organization name & department
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

  // Blue divider line
  doc.setDrawColor(...primaryBlue);
  doc.setLineWidth(1);
  doc.line(15, 38, pageWidth - 15, 38);

  // Document title
  doc.setFontSize(20);
  doc.setTextColor(...darkGray);
  doc.setFont("helvetica", "bold");
  doc.text(data.title, 15, 48);

  // Document number
  doc.setFontSize(9);
  doc.setTextColor(...lightGray);
  doc.setFont("helvetica", "italic");
  doc.text(`#${data.documentNumber}`, 15, 54);

  // ===== METADATA BOX =====
  const metadataY = 62;
  doc.setFillColor(248, 250, 252);
  doc.rect(15, metadataY, pageWidth - 30, 18, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, metadataY, pageWidth - 30, 18);

  // Order Date
  doc.setFontSize(7);
  doc.setTextColor(...lightGray);
  doc.setFont("helvetica", "bold");
  doc.text("ORDER DATE", 20, metadataY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...darkGray);
  doc.text(data.orderDate || new Date().toLocaleDateString(), 20, metadataY + 10);

  // Expected Delivery
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...lightGray);
  doc.text("EXPECTED DELIVERY", 70, metadataY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...darkGray);
  doc.text(data.expectedDeliveryDate || "N/A", 70, metadataY + 10);

  // Prepared By
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...lightGray);
  doc.text("PREPARED BY", 130, metadataY + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...darkGray);
  doc.text(data.preparedBy, 130, metadataY + 10);

  // Approved By
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

  // ===== SUPPLIER SECTION =====
  const supplierY = 88;
  doc.setFontSize(10);
  doc.setTextColor(...darkGray);
  doc.setFont("helvetica", "bold");
  doc.text("SUPPLIER INFORMATION", 15, supplierY);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...darkGray);
  doc.text(data.supplierName, 15, supplierY + 8);

  if (data.supplierEmail) {
    doc.setFontSize(8);
    doc.text(`Email: ${data.supplierEmail}`, 15, supplierY + 13);
  }

  if (data.supplierPhone) {
    doc.setFontSize(8);
    doc.text(`Phone: ${data.supplierPhone}`, 15, supplierY + 17);
  }

  // ===== LINE ITEMS TABLE =====
  const tableData = data.items.map((item) => [
    item.name,
    `${item.quantity} ${item.unit || "pcs"}`,
    `$${Number(item.unitPrice).toFixed(2)}`,
    `$${Number(item.total).toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: supplierY + 25,
    head: [["PRODUCT NAME", "QUANTITY", "UNIT PRICE", "TOTAL"]],
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
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 70, halign: "left" },
      1: { cellWidth: 35, halign: "center" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
    },
    margin: { left: 15, right: 15 },
  });

  // ===== TOTALS SECTION =====
  const tableEndY = (doc as any).lastAutoTable.finalY;
  const totalsY = tableEndY + 8;
  const totalsBoxX = pageWidth - 70;

  // Subtotal
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
  doc.text(`$${computedSubtotal.toFixed(2)}`, pageWidth - 15, totalsY, {
    align: "right",
  });

  if (tax > 0) {
    doc.setTextColor(...lightGray);
    doc.setFont("helvetica", "normal");
    doc.text("Tax:", totalsBoxX, totalsY + 8);
    doc.setTextColor(...darkGray);
    doc.setFont("helvetica", "bold");
    doc.text(`$${tax.toFixed(2)}`, pageWidth - 15, totalsY + 8, {
      align: "right",
    });
  }

  // Divider line
  doc.setDrawColor(...primaryBlue);
  doc.setLineWidth(0.8);
  doc.line(totalsBoxX - 5, totalsY + 14, pageWidth - 5, totalsY + 14);

  // Total
  doc.setFontSize(12);
  doc.setTextColor(...primaryBlue);
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", totalsBoxX, totalsY + 22);
  doc.setFontSize(14);
  doc.text(`$${total.toFixed(2)}`, pageWidth - 15, totalsY + 22, {
    align: "right",
  });

  // ===== NOTES SECTION =====
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

  // ===== FOOTER =====
  const footerY = pageHeight - 15;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);

  doc.setFontSize(7);
  doc.setTextColor(...lightGray);
  doc.setFont("helvetica", "normal");
  doc.text(`Document ID: PO-${Date.now().toString().slice(-8)}`, 15, footerY);
  doc.text("PURCHASE ORDER", pageWidth / 2, footerY, { align: "center" });
  doc.text("Page 1", pageWidth - 15, footerY, { align: "right" });

  // ===== RETURN AS BUFFER (Node) =====
  const arrayBuffer = doc.output("arraybuffer");
  const pdfBuffer = Buffer.from(arrayBuffer);

  return pdfBuffer;
}
