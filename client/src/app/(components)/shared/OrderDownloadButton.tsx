"use client";

import { DownloadCloudIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { generatePDF, PurchaseOrderPDFData } from "@/app/(components)/shared/PDFUtils";
import { PurchaseOrderDTO } from "@/app/state/api";

type POButtonProps = {
  poData: PurchaseOrderDTO;
  className?: string;
};

export function PurchaseOrderDownloadButton({
  poData,
  className = "flex items-center w-full text-sm text-gray-700 hover:bg-gray-100 p-2 rounded-md",
}: POButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      // Map the DTO to the PDF data structure
      const pdfData: PurchaseOrderPDFData = {
        documentType: "PO",
        title: "PURCHASE ORDER",
        documentNumber: poData.poNumber,
        preparedBy: "Hunter", // TODO: Get from user context
        organizationName: "Laboratory Services and Consultation Limited",
        departmentName: "Medical Laboratory Services",
        supplierName: poData.supplier?.name || "Unknown Supplier",
        supplierEmail: poData.supplier?.email,
        supplierPhone: poData.supplier?.phone,
        orderDate: formatDate(poData.orderDate),
        expectedDeliveryDate: poData.dueDate
          ? formatDate(poData.dueDate)
          : "TBD",
        items: poData.items.map((item) => ({
          name: item.name ||  "Unknown Item",
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          unit: item.unit || "pcs",
          total: Number(item.quantity) * Number(item.unitPrice),
        })),
        subtotal: Number(poData.subtotal),
        tax: Number(poData.tax),
        total: Number(poData.total),
        notes: poData.notes,
      };

      // Generate PDF (now async)
      await generatePDF(pdfData);
      toast.success("Purchase order downloaded successfully");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isGenerating}
      className={className}
    >
      {isGenerating ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 border-t-transparent mr-2" />
          Generating...
        </>
      ) : (
        <>
          <DownloadCloudIcon className="size-4 mr-2" />
          Download Order
        </>
      )}
    </button>
  );
}

// Helper function to format dates
function formatDate(dateString?: string): string {
  if (!dateString) return new Date().toLocaleDateString();
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}