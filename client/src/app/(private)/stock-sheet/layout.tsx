import { requirePerm } from "@/lib/server/requirePerm";
import { PERMS } from "@lab/shared";

export default async function StockSheetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePerm(PERMS.READ_PRODUCTS); // change to your real perm constant
  return <>{children}</>;
}
