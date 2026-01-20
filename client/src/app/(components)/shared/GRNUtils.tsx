import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"

export type GRNLineItem = {
  name: string;
  orderedQty?: number;
  receivedQty: number;
  unit: string;
  unitPrice?: number;
  total?: number;
}

export interface GoodsReceiptPDFData {
  documentType: "GRN";
  title: string;
  documentNumber: string;
  organizationName: string;
  departmentName?: string;

  preparedBy: string;
  receivedBy: string;

  supplierName: string;
  supplierEmail?: string;
  receiptDate?: string;
  purchaseOrderNumber?: string;

  notes?: string;

  items: GRNLineItem[];

  subtotal?: number;
  tax?: number;
  total?: number;
}

export async function generateGoodsReceiptPDF(data: GoodsReceiptPDFData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Same palette you used
  const primaryBlue: [number, number, number] = [37, 99, 235];
  const darkGray: [number, number, number] = [30, 41, 59];
  const lightGray: [number, number, number] = [100, 116, 139];

  // Logo (optional)
  try {
    const logoImg = await loadImage("/logo.png");
    if (logoImg) doc.addImage(logoImg, "PNG", 15, 15, 20, 20);
  } catch {}

  // Org header
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

  // Title + doc number
  doc.setFontSize(20);
  doc.setTextColor(...darkGray);
  doc.setFont("helvetica", "bold");
  doc.text(data.title, 15, 48);

  doc.setFontSize(9);
  doc.setTextColor(...lightGray);
  doc.setFont("helvetica", "italic");
  doc.text(`#${data.documentNumber}`, 15, 54);

  // Metadata box
  const metaY = 62;
  doc.setFillColor(248, 250, 252);
  doc.rect(15, metaY, pageWidth - 30, 18, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(15, metaY, pageWidth - 30, 18);

  // Receipt Date
  doc.setFontSize(7);
  doc.setTextColor(...lightGray);
  doc.setFont("helvetica", "bold");
  doc.text("RECEIPT DATE", 20, metaY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...darkGray);
  doc.text(data.receiptDate || new Date().toLocaleDateString(), 20, metaY + 10);

  // Prepared By
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...lightGray);
  doc.text("PREPARED BY", 90, metaY + 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...darkGray);
  doc.text(data.preparedBy, 90, metaY + 10);

  // PO number (if exists)
  if (data.purchaseOrderNumber) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...lightGray);
    doc.text("PURCHASE ORDER", 150, metaY + 5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...darkGray);
    doc.text(data.purchaseOrderNumber, 150, metaY + 10);
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

  if (data.supplierEmail) doc.text(`Email: ${data.supplierEmail}`, 15, supplierY + 13);
  //if (data.supplierPhone) doc.text(`Phone: ${data.supplierPhone}`, 15, supplierY + 17);

  // Table
  const tableData = data.items.map((it) => [
    it.name,
    it.orderedQty != null ? `${it.orderedQty} ${it.unit}` : "—",
    `${it.receivedQty} ${it.unit}`,
  ]);

  autoTable(doc, {
    startY: supplierY + 25,
    head: [["PRODUCT NAME", "ORDERED", "RECEIVED"]],
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
      0: { cellWidth: 90, halign: "left" },
      1: { cellWidth: 45, halign: "center" },
      2: { cellWidth: 45, halign: "center" },
    },
    margin: { left: 15, right: 15 },
  });

  // Notes
  if (data.notes) {
    const tableEndY = (doc as any).lastAutoTable.finalY;
    const notesY = tableEndY + 10;

    if (notesY < pageHeight - 35) {
      doc.setFillColor(255, 251, 235);
      doc.rect(15, notesY, pageWidth - 30, 20, "F");
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(2);
      doc.line(15, notesY, 15, notesY + 20);

      doc.setFontSize(8);
      doc.setTextColor(146, 64, 14);
      doc.setFont("helvetica", "bold");
      doc.text("NOTES", 20, notesY + 6);

      doc.setFontSize(8);
      doc.setTextColor(120, 53, 15);
      doc.setFont("helvetica", "normal");
      doc.text(doc.splitTextToSize(data.notes, pageWidth - 40), 20, notesY + 12);
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
  doc.text("GOODS RECEIPT", pageWidth / 2, footerY, { align: "center" });
  doc.text("Page 1", pageWidth - 15, footerY, { align: "right" });

  doc.save(`GRN-${data.documentNumber}.pdf`);
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
      if (!ctx) return reject(new Error("Canvas context failed"));
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}

