// App roles 

// App roles

export type Role =
  | "admin"
  | "adminLead"
  | "inventoryClerk"
  | "staffLead"
  | "labStaff"
  | "orderAgent"
  | "viewer"
  | "clientAdmin"
  | "clientUser";

export const PERMS = {
  ACCESS_HOME: "access_home",

  VIEW_DASHBOARD: "view_dashboard",

  // Inventory Page Perms
  READ_INVENTORY: "read_inventory",
  WRITE_INVENTORY: "write_inventory",

  // Product Draft Perms
  READ_PRODUCT_DRAFT: "read_product_draft",
  WRITE_PRODUCT_DRAFT: "write_product_draft",

  // Settings Page Perms
  VIEW_SETTINGS: "view_settings",
  MANAGE_SETTING: "manage_settings",

  // Products Page Perms
  READ_PRODUCTS: "read_products",
  WRITE_PRODUCTS: "write_products",

  // Users Page Perms
  READ_USERS: "read_users",
  WRITE_USERS: "write_users",

  // Organization Page Perms
  READ_ORGANIZATIONS: "read_organizations",
  WRITE_ORGANIZATIONS: "write_organizations",

  // Suppliers Page Perms
  READ_SUPPLIERS: "read_suppliers",
  WRITE_SUPPLIERS: "write_suppliers",

  // Purchase Order Page Perms
  READ_PURCHASE_ORDERS: "read_purchase_orders",
  WRITE_PURCHASE_ORDERS: "write_purchase_orders",

  // Supplier Invoices Page Perms
  READ_INVOICES: "read_invoices",
  WRITE_INVOICES: "write_invoices",

  // Expenses Page Perms
  READ_EXPENSES: "read_expenses",
  WRITE_EXPENSES: "write_expenses",

  // Goods Receipt Page Perms
  READ_GRNS: "read_grns",
  WRITE_GRNS: "write_grns",

  // Sales Page Perms
  READ_SALES: "read_sales",
  WRITE_SALES: "write_sales",

  // Stock Sheet Perms
  READ_STOCK_SHEET: "read_stock_sheet",
  WRITE_STOCK_SHEET: "write_stock_sheet",

  // Current User / Profile Perms
  READ_ME: "read_me",
  WRITE_ME: "write_me",

  // Client Portal Perms
  READ_CLIENT_PORTAL: "read_client_portal",
  READ_CLIENT_INVOICES: "read_client_invoices",
} as const;

export type Perm = typeof PERMS[keyof typeof PERMS];

const ALL_PERMS: Perm[] = Object.values(PERMS);

const BASIC_AUTHED_USER_PERMS: Perm[] = [
  PERMS.ACCESS_HOME,
  PERMS.READ_ME,
  PERMS.WRITE_ME,
];

const CLIENT_PORTAL_PERMS: Perm[] = [
  ...BASIC_AUTHED_USER_PERMS,
  PERMS.READ_CLIENT_PORTAL,
  PERMS.READ_CLIENT_INVOICES,
  PERMS.READ_ORGANIZATIONS,
];

const BASIC_STAFF_PERMS: Perm[] = [
  ...BASIC_AUTHED_USER_PERMS,
  PERMS.VIEW_SETTINGS,
  PERMS.READ_PRODUCTS,
  PERMS.READ_STOCK_SHEET,
  PERMS.WRITE_STOCK_SHEET,
];

export const ROLE_PERMS: Record<Role, Perm[]> = {
  // Full system owner/admin
  admin: ALL_PERMS,

  // High-level admin assistant, but not full system admin
  adminLead: [
    ...BASIC_STAFF_PERMS,

    PERMS.READ_USERS,
    PERMS.READ_ORGANIZATIONS,
    PERMS.WRITE_ORGANIZATIONS,

    PERMS.READ_SUPPLIERS,

    PERMS.READ_EXPENSES,
    PERMS.WRITE_EXPENSES,
    PERMS.READ_SALES,
    PERMS.WRITE_SALES,
  ],

  // Inventory/procurement manager
  inventoryClerk: [
    ...BASIC_STAFF_PERMS,

    PERMS.VIEW_DASHBOARD,

    PERMS.READ_INVENTORY,
    PERMS.WRITE_INVENTORY,

    PERMS.READ_PRODUCTS,
    PERMS.WRITE_PRODUCTS,

    PERMS.READ_USERS,
    PERMS.WRITE_USERS,

    PERMS.READ_ORGANIZATIONS,
    PERMS.WRITE_ORGANIZATIONS,

    PERMS.READ_SUPPLIERS,
    PERMS.WRITE_SUPPLIERS,

    PERMS.READ_PURCHASE_ORDERS,
    PERMS.WRITE_PURCHASE_ORDERS,

    PERMS.READ_INVOICES,
    PERMS.WRITE_INVOICES,

    PERMS.READ_EXPENSES,
    PERMS.WRITE_EXPENSES,

    PERMS.READ_GRNS,
    PERMS.WRITE_GRNS,

    PERMS.READ_PRODUCT_DRAFT,
    PERMS.WRITE_PRODUCT_DRAFT,

    PERMS.MANAGE_SETTING,
  ],

  // Internal staff lead: more than lab staff, less than inventory/admin
  staffLead: [
    ...BASIC_STAFF_PERMS,

    PERMS.READ_SALES,
    PERMS.WRITE_SALES,

    PERMS.READ_INVENTORY,

    PERMS.READ_EXPENSES,
  ],

  // Internal lab staff
  labStaff: [
    ...BASIC_STAFF_PERMS,

    PERMS.READ_SALES,
    PERMS.WRITE_SALES,
  ],

  // Can request/order stock, view products
  orderAgent: [
    ...BASIC_AUTHED_USER_PERMS,

    PERMS.VIEW_SETTINGS,
    PERMS.READ_PRODUCTS,
    PERMS.WRITE_STOCK_SHEET,
  ],

  // Minimal internal user
  viewer: [
    ...BASIC_AUTHED_USER_PERMS,
  ],

  // External client admin.
  // Not staff. No inventory, expenses, users, QuickBooks admin, etc.
  clientAdmin: [
    ...CLIENT_PORTAL_PERMS,
  ],

  // External client user.
  // Not staff. Read-only client portal access.
  clientUser: [
    ...CLIENT_PORTAL_PERMS,
  ],
};

export const hasPerm = (role: Role | undefined, perm: Perm): boolean =>
  !!role && ROLE_PERMS[role]?.includes(perm) === true;

export * from "./getGroupFromCategory";
//export * from "./userRolesUtils";