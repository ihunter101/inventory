"use client";

import StoreProvider from "./redux";
import { MuiThemeProviderWrapper } from "@/app/providers/ThemeProvider";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { setClerkTokenGetter } from "@/lib/clerkTokenGetter";

function ClerkTokenProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isLoaded } = useAuth();
  const [tokenReady, setTokenReady] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      setClerkTokenGetter(() => getToken());
      setTokenReady(true);
    }
  }, [isLoaded, getToken]);

  if (!tokenReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <ClerkTokenProvider>
        <MuiThemeProviderWrapper>
          {children}
        </MuiThemeProviderWrapper>
      </ClerkTokenProvider>
    </StoreProvider>
  );
}