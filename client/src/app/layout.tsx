import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import Providers from "./providers";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider 
      signInUrl="/sign-in" 
      signUpUrl="/sign-up" 
      afterSignInUrl="/dashboard" 
      afterSignUpUrl="/dashboard"
    >
      <html lang="en" suppressHydrationWarning>
        <body>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>         
            <Providers>
              <Toaster richColors position="top-right" />
              {children}
            </Providers>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}