import { Request, Response } from 'express';
import resend from '../config/resend';
import { generatePurchaseOrderPDFBuffer } from '../services/pdfServices';
import { getPurchaseOrderDetails } from '../services/purchaseOrderService'; 
import { mapPurchaseOrderDataToPDF } from '../lib/PurchaseOrderToPDFMapper';

import  { getGoodsReceiptDetails } from "../services/GoodsReceiptService";
import { mapGoodsReceiptDataToPDF } from "../lib/GoodsReceiptPDFMapper";
import { generateGoodsReceiptPDFBuffer } from "../services/grnPdfServices";

// Assuming this is the data structure received from the frontend
interface ResendEmailBody {
    poId: string;
    poNumber: string;
    recipientEmail: string;
}

type Body = {
    docType: string;
    docId: string;
    docNumber: string;
    recipientEmail: string;
}

// Use the verified sender email from your Resend setup (e.g., from the 'send' subdomain)
const SENDER_EMAIL = process.env.RESEND_SENDER_EMAIL as string; 

export const resendPurchaseOrderEmail = async (req: Request<{}, {}, ResendEmailBody>, res: Response) => {
    console.log("Request body:", req.body);
    console.log("Request params:", req.params)
        
    const { poId, poNumber, recipientEmail } = req.body; 

    if (!poId || !recipientEmail) {
        return res.status(400).json({ message: "Missing PO ID or recipient email." });
    }

    try {
        // 1. Fetch data from your database (REQUIRED)
        const poData = await getPurchaseOrderDetails(poId); 
        const pdfData = mapPurchaseOrderDataToPDF(poData)
        
        // 2. Generate the PDF attachment Buffer
        const attachmentBuffer = generatePurchaseOrderPDFBuffer(pdfData);
        
        // 3. Send the Email via Resend
        // FIXED: Use the correct 'from' format - just the email or "Name <email>" format
        const { data, error } = await resend.emails.send({
            from: `Laboratory Services and Consultations Limited <${SENDER_EMAIL}>`, // ✅ Correct format
            to: [recipientEmail], 
            subject: `PURCHASE ORDER #${poNumber} - Action Required`,
            
            html:   `<p>Dear ${poData.supplier.name},</p>
                    <p>Please find the Purchase Order attached.</p>
                    <p>Best regards,<br/>Laboratory Services and Consultation Limited</p>`,
            
            attachments: [
                {
                    filename: `PO-${poNumber}.pdf`,
                    content: attachmentBuffer, 
                },
            ],
        });

        if (error) {
            console.error("Resend API Error:", error);
            return res.status(400).json({ error: error.message });
        }

        return res.status(200).json({ data, message: "Purchase Order email sent successfully." });

    } catch (error) {
        console.error("Email sending error:", error);
        return res.status(500).json({ message: "Failed to send Purchase Order email." });
    }
}


export const sednDocumentEmail = async (req: Request, res: Response) => {
    const { docType, docId, docNumber, recipientEmail } = req.body as Body;

    if (!docType || !docId || !recipientEmail) {
        return res.status(400).json({ message: "Missing document type, id, number and recipient email." });
    }

    try {
        let supplierName = "Supplier";
        let attachmentFilename = "document.pdf";
        let attachmentBuffer: Buffer;
        let subject = '';
        let html = '';

        if (docType === "purchase-order") {
            const poData = await getPurchaseOrderDetails(docId);
            supplierName = poData.supplier.name;

            const pdfData = mapPurchaseOrderDataToPDF(poData);
            attachmentBuffer = generatePurchaseOrderPDFBuffer(pdfData);

            attachmentFilename = `PO-${docNumber}.pdf`;
            subject = `PURCHASE ORDER #${docNumber} - Action Required`;
            html = `<p>Dear  ${supplierName},</p>
                    <p>Please find the Purchase Order attached.</p>
                    <p>Best regards, <br/> Laboratory Services and Consultations Limited</p>
            ` } else if (docType === "goods-receipt") {
                const grnData = await getGoodsReceiptDetails(docId)
                supplierName = supplierName

                const pdfData = mapGoodsReceiptDataToPDF(grnData);
                attachmentBuffer = generateGoodsReceiptPDFBuffer(pdfData)

                attachmentFilename = `GRN-${docNumber}.pdf`
                subject =`Goods Receipt #${docNumber} - Action Required`;
                html = `<p>Dear ${supplierName}, <p>
                        <p>Please find the Goods Receipt Attached.</p>
                        <Warm regards, <br/> Laboratory Services and Consultation Limited.`
            } else {
                return res.status(400).json({ message: "Invalid document type." });
            }

            const { data, error } = await resend.emails.send({
                from: `Laboratory Services and Consultations Limited <${SENDER_EMAIL}>`,
                to: [recipientEmail],
                subject,
                html,
                attachments: [{ filename: attachmentFilename, content: attachmentBuffer }]
            })
            if (error) return res.status(400).json({ message: error.message})

            return res.status(200).json({ data, message: "Email sent succesfully."})
    } catch (e: any) {
        console.error("sendDocumentEmail error:", e);
        return res.status(500).json({ message: e?.message || "Failed to send document email." });
    }
}