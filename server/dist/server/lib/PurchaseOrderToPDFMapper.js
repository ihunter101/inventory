"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapPurchaseOrderDataToPDF = mapPurchaseOrderDataToPDF;
function mapPurchaseOrderDataToPDF(po) {
    // convert PoItem[] → LineItem[]
    const items = po.items.map((item) => {
        var _a;
        return ({
            name: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unit: item.unit,
            total: (_a = item.lineTotal) !== null && _a !== void 0 ? _a : item.quantity * item.unitPrice,
        });
    });
    const subtotal = items.reduce((sum, it) => sum + it.total, 0);
    return {
        documentType: "PO",
        title: "Purchase Order",
        documentNumber: po.poNumber,
        preparedBy: "System", // or pull from user/context later
        organizationName: "Laboratory Services & Consultations Ltd.",
        // departmentName: "Purchasing", // optional
        supplierName: po.supplier.name,
        supplierEmail: po.supplier.email,
        expectedDeliveryDate: "N/A", // or derive from PO
        orderDate: new Date().toISOString().slice(0, 10),
        items,
        subtotal,
        total: po.total,
        tax: po.total - subtotal > 0 ? po.total - subtotal : 0,
        // notes: "Optional notes here",
        // approvedBy: "Manager Name",
    };
}
