import { requirePerm } from "@/lib/server/requirePerm";
import { PERMS } from "@lab/shared";

export default async function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePerm(PERMS.READ_INVENTORY); // change to your real perm constant
  return <>{children}</>;
}
