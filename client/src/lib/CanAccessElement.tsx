"use client";
import { useGetMeQuery } from "@/app/state/api";
import { hasPerm, type Perm, type Role } from "@lab/shared";

interface Props {
  children: React.ReactNode;
  permission?: Perm; // Optional: specific permission check
}

/**
 * Conditionally renders children based on the user's role and optional specific permission check.
 * If the user is not staff or admin, or if the permission check fails, the element is not rendered.
 * @param children The element(s) to conditionally render.
 * @param permission Optional: a specific permission to check in addition to the default role check.
 * @returns The rendered children if the checks pass, null otherwise.
 */
export default function CanAccessElement({ children, permission }: Props) {
  const { data, isLoading } = useGetMeQuery();

  if (isLoading || !data?.user) return null;

  const userRole = data.user.role as Role;

  // 1. If a specific permission is required, check it
  if (permission && !hasPerm(userRole, permission)) {
    return null;
  }

  // 2. Default fallback: only allow staff/admin
  const isStaff = userRole === "admin" || userRole === "inventoryClerk";
  
  if (!isStaff) return null;

  return <>{children}</>;
}