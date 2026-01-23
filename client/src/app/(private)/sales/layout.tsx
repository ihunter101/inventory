import { requirePerm } from "@/lib/server/requirePerm";
import { PERMS } from "@lab/shared";

export default async function SalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePerm(PERMS.READ_SALES); // change to your real perm constant
  return <>{children}</>;
}
