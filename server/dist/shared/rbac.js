"use strict";
// App roles 
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPerm = exports.ROLE_PERMS = exports.PERMS = void 0;
exports.PERMS = {
    ACCESS_HOME: 'access_home',
    VIEW_DASHBOARD: 'view_dashboard',
    // inventory Page Perms
    READ_INVENTORY: 'read_inventory',
    WRITE_INVENTORY: 'write_inventory',
    // Setting Page Perms
    VIEW_SETTINGS: "view_settings",
    MANAGE_SETTING: "manage_settings",
    // Products Page Perms
    READ_PRODUCTS: 'read_products',
    WRITE_PRODUCTS: 'write_products',
    // Users Page Perms
    READ_USERS: 'read_users',
    WRITE_USERS: 'write_users',
    // Suppliers Page Perms 
    READ_SUPPLIERS: 'read_suppliers',
    WRITE_SUPPLIERS: 'write_suppliers',
    // Purchase-Order Page Perm
    READ_PURCHASE_ORDERS: 'read_purchase_orders',
    WRITE_PURCHASE_ORDERS: 'write_purchase_orders',
    // Supplier Invoices Page Perms
    READ_INVOICES: 'read_invoices',
    WRITE_INVOICES: 'write_invoices',
    // Expenses  Page Perms
    READ_EXPENSES: 'read_expenses',
    WRITE_EXPENSES: 'write_expenses',
    // Goods Receipt Page Perms 
    READ_GRNS: 'read_grns',
    WRITE_GRNS: 'write_grns',
    // Sales Page Perms (future Page)
    READ_SALES: 'read_sales',
    WRITE_SALES: 'write_sales',
};
const ALL_PERMS = Object.values(exports.PERMS);
//  Role --> allowed permission 
exports.ROLE_PERMS = {
    //1. Admin: Everything
    admin: ALL_PERMS,
    //2. Inventory Clerk: 
    //      manage invoices, POs, GRNs, inventory, product, users, dashboard, settings
    inventoryClerk: [
        exports.PERMS.ACCESS_HOME,
        exports.PERMS.VIEW_DASHBOARD,
        exports.PERMS.READ_INVENTORY, exports.PERMS.WRITE_INVENTORY,
        exports.PERMS.READ_PRODUCTS, exports.PERMS.WRITE_PRODUCTS,
        exports.PERMS.READ_USERS, exports.PERMS.WRITE_USERS,
        exports.PERMS.READ_SUPPLIERS, exports.PERMS.WRITE_SUPPLIERS,
        exports.PERMS.READ_PURCHASE_ORDERS, exports.PERMS.WRITE_PURCHASE_ORDERS,
        exports.PERMS.READ_INVOICES, exports.PERMS.WRITE_INVOICES,
        exports.PERMS.READ_EXPENSES, exports.PERMS.WRITE_EXPENSES,
        exports.PERMS.READ_GRNS, exports.PERMS.WRITE_GRNS,
        exports.PERMS.VIEW_SETTINGS, exports.PERMS.MANAGE_SETTING,
    ],
    labStaff: [
        exports.PERMS.ACCESS_HOME,
        exports.PERMS.READ_SALES, exports.PERMS.WRITE_SALES,
        exports.PERMS.READ_PRODUCTS, exports.PERMS.VIEW_SETTINGS
    ],
    orderAgent: [
        exports.PERMS.ACCESS_HOME,
        exports.PERMS.READ_PRODUCTS,
        exports.PERMS.VIEW_SETTINGS,
    ],
    viewer: [
        exports.PERMS.ACCESS_HOME
    ],
};
const hasPerm = (role, perm) => { var _a; return !!role && ((_a = exports.ROLE_PERMS[role]) === null || _a === void 0 ? void 0 : _a.includes(perm)) === true; };
exports.hasPerm = hasPerm;
