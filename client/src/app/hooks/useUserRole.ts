// ============================================
// client/src/hooks/useUserRole.ts
// ============================================
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

interface UserRoleState {
  role: string | null;
  location: string | null;
  isLoading: boolean;
  error: Error | null;
}

export function useUserRole(): UserRoleState {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const [state, setState] = useState<UserRoleState>({
    role: null,
    location: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchUserRole() {
      // Not ready yet
      if (!isLoaded) return;

      // Not signed in
      if (!isSignedIn) {
        if (!cancelled) {
          setState({
            role: null,
            location: null,
            isLoading: false,
            error: null,
          });
        }
        return;
      }

      try {
        const token = await getToken(); // ✅ correct
        if (!token) throw new Error("No auth token available");

        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        if (!baseUrl) throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");

        const res = await fetch(`${baseUrl}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!res.ok) {
          const msg = await res.text().catch(() => "");
          throw new Error(`Failed to fetch user role (${res.status}) ${msg}`);
        }

        const data = await res.json();

        if (!cancelled) {
          setState({
            role: data.role ?? null,
            location: data.location ?? null,
            isLoading: false,
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            role: null,
            location: null,
            isLoading: false,
            error: err as Error,
          });
        }
      }
    }

    fetchUserRole();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  return state;
}
