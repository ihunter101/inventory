import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import DashboardWrapper from "./DashboardWrapper";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LCS Inventory",
  description: "Inventory and analytics platform for labs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
           <Toaster richColors position="top-right" />
          <DashboardWrapper>{children}</DashboardWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
