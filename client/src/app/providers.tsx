"use client";

import StoreProvider from "./redux";
import { MuiThemeProviderWrapper } from "@/app/providers/ThemeProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <MuiThemeProviderWrapper>
        {children}
      </MuiThemeProviderWrapper>
    </StoreProvider>
  );
}