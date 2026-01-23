"use client";

import { ReactNode } from "react";
import { Perm } from "@lab/shared";
import { useAuth } from "@/app/hooks/useAuth";

interface ProtectProps {
  children: ReactNode;
  perm?: Perm;
  perms?: Perm[];
  fallback?: ReactNode;

}

/**
 * Elemet level protection for frontend rolebase access control
 * @param param0 
 * @returns 
 * @example <Protect perm={PERMS.WRITE_USERS} fallback={<span className="text-gray-400">Read Only</span>}>
  <button onClick={handleDelete}>Delete User</button>
</Protect>
 */
export const Protect = ({
  children,
  perm,
  fallback = null
}: ProtectProps) => {
  const { can, isLoading } = useAuth();

  // 1. If we are still loading, you have two choices:
  //    - Return null (hide until sure)
  //    - Return a skeleton (better UX)
  //    - Return children (flash of unauthorized content - BAD)
  if (isLoading) return null;

  //2. Check Permission
  if (perm && !can(perm)) {
    return <>{fallback}</>
  }

  //3.Render Content
  return <>{children}</>
}