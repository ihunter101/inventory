// // src/app/lib/server/requirePerm.ts
// import "server-only";
// import { notFound } from "next/navigation";
// import { getMeServer } from "./getMe";
// import { PERMS, type Perm } from "@lab/shared";

// // You need a role -> perms mapping.
// // Put it in @lab/shared ideally.
// const ROLE_PERMS: Record<string, Perm[]> = {
//   admin: Object.values(PERMS) as Perm[],
//   orderAgent: [
//     PERMS.ACCESS_HOME,
//     PERMS.READ_PRODUCTS,
//     PERMS.VIEW_SETTINGS,
//     PERMS.READ_ME, PERMS.WRITE_ME
//   ],
//   viewer: [
//     PERMS.ACCESS_HOME,
//     PERMS.READ_ME, PERMS.WRITE_ME
//   ],
//   labStaff: [
//     PERMS.ACCESS_HOME,
//     PERMS.READ_SALES, PERMS.WRITE_SALES,
//     PERMS.READ_PRODUCTS, PERMS.VIEW_SETTINGS,
//     PERMS.READ_ME, PERMS.WRITE_ME
//   ],
//   inventoryClerk: [
//     PERMS.ACCESS_HOME,
//         PERMS.VIEW_DASHBOARD,

//         PERMS.READ_INVENTORY, PERMS.WRITE_INVENTORY,

//         PERMS.READ_PRODUCTS, PERMS.WRITE_PRODUCTS,

//         PERMS.READ_USERS, PERMS.WRITE_USERS,

//         PERMS.READ_SUPPLIERS, PERMS.WRITE_SUPPLIERS,

//         PERMS.READ_PURCHASE_ORDERS, PERMS.WRITE_PURCHASE_ORDERS,

//         PERMS.READ_INVOICES, PERMS.WRITE_INVOICES,

//         PERMS.READ_EXPENSES, PERMS.WRITE_EXPENSES,

//         PERMS.READ_GRNS, PERMS.WRITE_GRNS,

//         PERMS.VIEW_SETTINGS, PERMS.MANAGE_SETTING,

//         PERMS.READ_PRODUCT_DRAFT, PERMS.WRITE_PRODUCT_DRAFT,

//         PERMS.READ_STOCK_SHEET, PERMS.WRITE_STOCK_SHEET,

//         PERMS.READ_ME, PERMS.WRITE_ME
//   ]
// };

// export async function requirePerm(required: Perm) {
//   const me = await getMeServer();
//   if (!me) notFound();

//   const perms = ROLE_PERMS[me.role] ?? [];
//   if (!perms.includes(required)) notFound();

//   return me;
// }

// client/lib/server/requirePerm.ts
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { hasPerm, Perm } from "@lab/shared";

export async function requirePerm(perm: Perm) {
  const { userId, getToken } = await auth();
  
  if (!userId) {
    // This shouldn't happen due to middleware, but defense in depth
 notFound();
  }

  const token = await getToken();
  const apiURL = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiURL) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not defined");
  }

  const res = await fetch(`${apiURL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-cache"
  });

  if (!res.ok) {
    notFound();
  }

  const data = await res.json();
  const user = data?.user;
  const role = user?.role;

  console.log("[requirePerm] userId:", userId);
console.log("[requirePerm] /me role:", role);
console.log("[requirePerm] required perm:", perm);


  // Check if user has the required permission
  if (!role || !hasPerm(role, perm)) {
    console.warn(`[requirePerm] Access denied: User lacks '${perm}'`);
    //notFound(); // ← Triggers 404
   notFound();
  }

  return { user, role }; // Optionally return user data
}