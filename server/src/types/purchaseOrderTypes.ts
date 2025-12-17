// Define the structure of a single item/row in the PO
export interface PoItem {
    productName: string;
    quantity: number;
    unitPrice: number;
    unit: string;
    lineTotal: number;
}

// Define the full structure of the Purchase Order data returned from the database
export interface PoData {
    id: string; // Used internally
    poNumber: string; // e.g., "PO-2025-001"
    supplier: { 
        name: string;
        email: string; // Crucial for sending email
    };
    total: number; // Final calculated total
    items: PoItem[]; // Array of line items
    // Add other fields like deliveryDate, etc., as needed
}