import { requirePerm } from "@/lib/server/requirePerm";
import { PERMS } from "@lab/shared";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePerm(PERMS.READ_PURCHASE_ORDERS); // change to your real perm constant
  return <>{children}</>;
}
