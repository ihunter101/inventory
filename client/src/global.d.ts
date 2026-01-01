export {};

declare global {
  // 1. Extend Clerk's Session Claims (For Middleware & Server)
  interface CustomJwtSessionClaims {
    public_metadata: {
      onboardingComplete?: boolean;
    };
    // These match the keys you set in the Clerk Dashboard
    orgId?: string;
    userId?: string;
    orgRole?: string;
  }

  // 2. Your existing Window definition (Keep this if you use it in client components)
  interface Window {
    Clerk?: {
      session?: {
        getToken: (options?: any) => Promise<string | null>;
      };
    };
  }
}