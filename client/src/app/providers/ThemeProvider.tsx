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
                  default: "#f6f8fb",
                  paper: "#ffffff",
                },
                text: {
                  primary: "#111827",
                  secondary: "#6b7280",
                },
                divider: "rgba(17, 24, 39, 0.08)",
              }
            : {
                primary: {
                  main: "hsl(142.1, 70.6%, 45.3%)",
                },
                background: {
                  default: "#0b0f14",
                  paper: "#11161d",
                },
                text: {
                  primary: "#e5e7eb",
                  secondary: "#9ca3af",
                },
                divider: "rgba(255,255,255,0.08)",
              }),
        },
        shape: {
          borderRadius: 14,
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: {
              body: {
                backgroundImage: "none",
                backgroundColor: mode === "dark" ? "#0b0f14" : "#f6f8fb",
                color: mode === "dark" ? "#e5e7eb" : "#111827",
              },
            },
          },
          MuiCard: {
            styleOverrides: {
              root: ({ theme }: { theme: Theme }) => ({
                backgroundImage: "none",
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow:
                  theme.palette.mode === "dark"
                    ? "0 1px 2px rgba(0,0,0,0.35)"
                    : "0 1px 2px rgba(15,23,42,0.04)",
              }),
            },
          },
          MuiCardHeader: {
            styleOverrides: {
              root: ({ theme }: { theme: Theme }) => ({
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.02)"
                    : "#f8fafc",
                borderBottom: `1px solid ${theme.palette.divider}`,
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
          MuiDialog: {
            styleOverrides: {
              paper: ({ theme }: { theme: Theme }) => ({
                backgroundImage: "none",
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
              }),
            },
          },
          MuiDrawer: {
            styleOverrides: {
              paper: ({ theme }: { theme: Theme }) => ({
                backgroundImage: "none",
                backgroundColor:
                  theme.palette.mode === "dark" ? "#0f141a" : "#ffffff",
                borderRight: `1px solid ${theme.palette.divider}`,
              }),
            },
          },
          MuiAppBar: {
            styleOverrides: {
              root: ({ theme }: { theme: Theme }) => ({
                backgroundImage: "none",
                backgroundColor:
                  theme.palette.mode === "dark" ? "#0f141a" : "#ffffff",
                borderBottom: `1px solid ${theme.palette.divider}`,
                boxShadow: "none",
              }),
            },
          },
          MuiTextField: {
            styleOverrides: {
              root: ({ theme }: { theme: Theme }) => ({
                "& .MuiOutlinedInput-root": {
                  backgroundColor:
                    theme.palette.mode === "dark" ? "#0d1319" : "#ffffff",
                  borderRadius: 12,
                },
              }),
            },
          },
          // @ts-ignore - MuiDataGrid is from @mui/x-data-grid
          MuiDataGrid: {
            styleOverrides: {
              root: ({ theme }: { theme: Theme }) => ({
                border: 0,
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                "& .MuiDataGrid-cell": {
                  borderColor: theme.palette.divider,
                },
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.02)"
                      : "#f8fafc",
                  borderColor: theme.palette.divider,
                },
                "& .MuiDataGrid-footerContainer": {
                  borderColor: theme.palette.divider,
                  backgroundColor: theme.palette.background.paper,
                },
                "& .MuiDataGrid-toolbarContainer": {
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.02)"
                      : "#f8fafc",
                  borderBottom: `1px solid ${theme.palette.divider}`,
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