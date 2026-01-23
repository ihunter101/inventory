//client/src/app/(components)/auth/Can.tsx

"use client";

import { Perm } from "@lab/shared";
import { useAuth } from "@/app/hooks/useAuth";

interface CanProps {
  /** Single permission to check */
  perm?: Perm;
  /** Multiple permissions - user needs ANY of them (OR logic) */
  anyOf?: Perm[];
  /** Multiple permissions - user needs ALL of them (AND logic) */
  allOf?: Perm[];
  /** Content to render if user has permission - can be ReactNode or function */
  children: React.ReactNode | (() => React.ReactNode);
  /** Optional fallback to render if user lacks permission */
  fallback?: React.ReactNode;
}

/**
 * Permission-based conditional rendering component.
 * Hides UI elements the user shouldn't see/interact with.
 * 
 * Usage:
 * <Can perm={PERMS.WRITE_USERS}>
 *   <button>Delete User</button>
 * </Can>
 * 
 * Or with function children for dynamic content:
 * <Can perm={PERMS.WRITE_USERS}>
 *   {() => <button>Delete User</button>}
 * </Can>
 */
export const Can = ({ 
  perm, 
  anyOf, 
  allOf, 
  children, 
  fallback = null 
}: CanProps) => {
  const { can, canAny, canAll, isLoading } = useAuth();

  // Don't show anything while loading
  if (isLoading) {
    return <>{fallback}</>;
  }

  // Check permission based on which prop was provided
  let hasPermission = false;

  if (perm) {
    hasPermission = can(perm);
  } else if (anyOf) {
    hasPermission = canAny(anyOf);
  } else if (allOf) {
    hasPermission = canAll(allOf);
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  // Support both direct children and function children
  return <>{typeof children === 'function' ? children() : children}</>;
};