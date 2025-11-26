// App roles 

export type Role = "admin" | "inventoryClerk" | "labStaff" | "orderAgent" | "viewer"

export const PERMS = {
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

} as const;

export type Perm = typeof PERMS[keyof typeof PERMS]


const ALL_PERMS: Perm[] = Object.values(PERMS)

//  Role --> allowed permission 
export const ROLE_PERMS: Record<Role, Perm[]> = {
    //1. Admin: Everything
    admin: ALL_PERMS, 

    //2. Inventory Clerk: 
    //      manage invoices, POs, GRNs, inventory, product, users, dashboard, settings
    inventoryClerk: [
        PERMS.ACCESS_HOME,
        PERMS.VIEW_DASHBOARD,

        PERMS.READ_INVENTORY, PERMS.WRITE_INVENTORY,

        PERMS.READ_PRODUCTS, PERMS.WRITE_PRODUCTS,

        PERMS.READ_USERS, PERMS.WRITE_USERS,

        PERMS.READ_SUPPLIERS, PERMS.WRITE_SUPPLIERS,

        PERMS.READ_PURCHASE_ORDERS, PERMS.WRITE_PURCHASE_ORDERS,

        PERMS.READ_INVOICES, PERMS.WRITE_INVOICES,

        PERMS.READ_EXPENSES, PERMS.WRITE_EXPENSES,

        PERMS.READ_GRNS, PERMS.WRITE_GRNS,

        PERMS.VIEW_SETTINGS, PERMS.MANAGE_SETTING,
    ],

    labStaff: [
        PERMS.ACCESS_HOME,
        PERMS.READ_SALES, PERMS.WRITE_SALES,
        PERMS.READ_PRODUCTS, PERMS.VIEW_SETTINGS
    ],

    orderAgent: [
        PERMS.ACCESS_HOME,
        PERMS.READ_PRODUCTS,
        PERMS.VIEW_SETTINGS,
    ],

    viewer: [
        PERMS.ACCESS_HOME
    ],

}

export const hasPerm = (role: Role | undefined, perm: Perm): boolean => 
    !!role && ROLE_PERMS[role]?.includes(perm) === true;