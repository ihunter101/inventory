"use client";

import { createTheme, ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useMemo, useEffect, useState } from "react";
import type { Theme } from "@mui/material/styles";

export function MuiThemeProviderWrapper({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setMode(isDark ? "dark" : "light");
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const isDark = document.documentElement.classList.contains("dark");
    setMode(isDark ? "dark" : "light");

    return () => observer.disconnect();
  }, []);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === "light"
            ? {
                primary: {
                  main: "hsl(142.1, 70.6%, 45.3%)",
                },
                background: {
                  default: "#f8fafc",
                  paper: "#ffffff",
                },
                text: {
                  primary: "#0f172a",
                  secondary: "#64748b",
                },
                divider: "#e2e8f0",
              }
            : {
                primary: {
                  main: "hsl(142.1, 70.6%, 45.3%)",
                },
                background: {
                  default: "#0f172a",
                  paper: "#1e293b",
                },
                text: {
                  primary: "#f1f5f9",
                  secondary: "#cbd5e1",
                },
                divider: "#334155",
              }),
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: ({ theme }: { theme: Theme }) => ({
                backgroundImage: "none",
                backgroundColor: theme.palette.background.paper,
              }),
            },
          },
          MuiCardHeader: {
            styleOverrides: {
              root: ({ theme }: { theme: Theme }) => ({
                backgroundColor: theme.palette.mode === "dark" ? "#1e293b" : "#f9fafb",
              }),
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: ({ theme }: { theme: Theme }) => ({
                backgroundImage: "none",
                backgroundColor: theme.palette.background.paper,
              }),
            },
          },
          // @ts-ignore - MuiDataGrid is from @mui/x-data-grid
          MuiDataGrid: {
            styleOverrides: {
              root: ({ theme }: { theme: Theme }) => ({
                border: 0,
                backgroundColor: theme.palette.background.paper,
                "& .MuiDataGrid-cell": {
                  borderColor: theme.palette.divider,
                },
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: theme.palette.mode === "dark" ? "#1e293b" : "#f9fafb",
                  borderColor: theme.palette.divider,
                },
                "& .MuiDataGrid-footerContainer": {
                  borderColor: theme.palette.divider,
                  backgroundColor: theme.palette.background.paper,
                },
              }),
            },
          },
        },
      }),
    [mode]
  );

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}