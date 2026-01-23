import { requirePerm } from "@/lib/server/requirePerm";
import { PERMS } from "@lab/shared";

export default async function InvoiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePerm(PERMS.READ_INVOICES); // change to your real perm constant
  return <>{children}</>;
}
