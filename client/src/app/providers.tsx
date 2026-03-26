"use client";

import StoreProvider from "./redux";
import { MuiThemeProviderWrapper } from "@/app/providers/ThemeProvider";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { setClerkTokenGetter } from "@/lib/clerkTokenGetter";

function ClerkTokenProvider({ children }: { children: React.ReactNode }) {
  const { getToken, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      setClerkTokenGetter(() => getToken());
    }
  }, [isLoaded, getToken]);

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