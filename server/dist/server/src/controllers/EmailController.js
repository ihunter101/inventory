"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendPurchaseOrderEmail = void 0;
const resend_1 = __importDefault(require("../config/resend"));
const pdfServices_1 = require("../services/pdfServices");
const purchaseOrderService_1 = require("../services/purchaseOrderService");
const PurchaseOrderToPDFMapper_1 = require("../../lib/PurchaseOrderToPDFMapper");
// Use the verified sender email from your Resend setup (e.g., from the 'send' subdomain)
const SENDER_EMAIL = process.env.RESEND_SENDER_EMAIL;
const resendPurchaseOrderEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Request body:", req.body);
    console.log("Request params:", req.params);
    const { poId, poNumber, recipientEmail } = req.body;
    if (!poId || !recipientEmail) {
        return res.status(400).json({ message: "Missing PO ID or recipient email." });
    }
    try {
        // 1. Fetch data from your database (REQUIRED)
        const poData = yield (0, purchaseOrderService_1.getPurchaseOrderDetails)(poId);
        const pdfData = (0, PurchaseOrderToPDFMapper_1.mapPurchaseOrderDataToPDF)(poData);
        // 2. Generate the PDF attachment Buffer
        const attachmentBuffer = (0, pdfServices_1.generatePurchaseOrderPDFBuffer)(pdfData);
        // 3. Send the Email via Resend
        // FIXED: Use the correct 'from' format - just the email or "Name <email>" format
        const { data, error } = yield resend_1.default.emails.send({
            from: `Laboratory Services and Consultations Limited <${SENDER_EMAIL}>`, // ✅ Correct format
            to: [recipientEmail],
            subject: `PURCHASE ORDER #${poNumber} - Action Required`,
            html: `<p>Dear ${poData.supplier.name},</p>
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
    }
    catch (error) {
        console.error("Email sending error:", error);
        return res.status(500).json({ message: "Failed to send Purchase Order email." });
    }
});
exports.resendPurchaseOrderEmail = resendPurchaseOrderEmail;
