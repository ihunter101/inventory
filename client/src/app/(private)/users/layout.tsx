// app/(private)/users/layout.tsx
import { requirePerm } from "@/lib/server/requirePerm";
import { PERMS } from "@lab/shared";

export default async function UsersLayout({ children }: { children: React.ReactNode }) {
  // ✅ Just call it - if permission denied, notFound() is called inside and execution stops
  await requirePerm(PERMS.READ_USERS);
  
  // ✅ This line only runs if permission check passed
  return <>{children}</>;
}