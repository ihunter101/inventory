import { useUser } from "@clerk/nextjs";
import { useGetMeQuery } from "@/app/state/api";
import { useMemo } from "react";
import { usePathname } from "next/navigation";

export function useCurrentUser(options?: { skipDbCheck?: boolean }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const pathname = usePathname();
  
  // Don't fetch DB user on onboarding/sign-in pages to prevent circular redirects
  const isOnboardingPage = pathname?.startsWith('/onboarding') || pathname?.startsWith('/sign-in');
  const shouldSkipDb = options?.skipDbCheck || isOnboardingPage;
  
  const { 
    data: meData, 
    isLoading: meLoading, 
    error: meError 
  } = useGetMeQuery(undefined, {
    skip: !clerkLoaded || !clerkUser || shouldSkipDb,
  });

  const dbUser = meData?.user;

  const combinedUser = useMemo(() => {
    if (!clerkUser) return null;

    return {
      // Database fields (preferred)
      id: dbUser?.id,
      clerkId: clerkUser.id,
      email: dbUser?.email || clerkUser.primaryEmailAddress?.emailAddress,
      name: dbUser?.name || clerkUser.fullName,
      role: dbUser?.role || (clerkUser.publicMetadata?.role as string) || "User",
      location: dbUser?.location || (clerkUser.publicMetadata?.location as string) || "Unknown",
      createdAt: dbUser?.createdAt,
      lastLogin: dbUser?.lastLogin,
      
      // Clerk-specific
      imageUrl: clerkUser.imageUrl,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
    };
  }, [clerkUser, dbUser]);

  return {
    user: combinedUser,
    dbUser,
    clerkUser,
    isLoading: !clerkLoaded || (meLoading && !shouldSkipDb),
    isLoaded: clerkLoaded && (shouldSkipDb || !meLoading),
    error: meError,
    needsOnboarding: !shouldSkipDb && meError && 'status' in meError && meError.status === 404,
  };
}