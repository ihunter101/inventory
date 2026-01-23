import { useGetMeQuery } from "@/app/state/api";
import { hasPerm, Perm, Role } from "@lab/shared";

export const useAuth = () => {
  // RTKQ automatically deduplicates requests, so this is safe to call everywhere
  const { data, isLoading, isError, error } = useGetMeQuery();

  const user = data?.user;
  const role = user?.role as Role | undefined;

  /**
   * Check if the current user has a specific permission.
   * Leverages the exact logic from the backend.
   */
  const can = (perm: Perm): boolean => {
    if (isLoading || !user || !role) return false;
    return hasPerm(role, perm);
  };

  /** 
   * Check if the user has any of the required permissions (OR logic)
   */
  const canAny = (perms: Perm[]): boolean => {
    return perms.some((p) => can(p));
  };

  /**
   * Check if current user has all required permissions (AND logic)
   */
  const canAll = (perms: Perm[]): boolean => {
    return perms.every((p) => can(p));
  };

  return {
    user,
    role,
    isLoading,
    isError,
    error,
    isAuthenticated: !!user,
    can,
    canAny,
    canAll,
  };
};