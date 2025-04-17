"use client";

import type React from "react";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { AuthGuard } from "@/components/auth-guard";
import { AppHeader } from "@/components/app-header";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export function ClientRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <AuthGuard>
              <NavbarWrapper>{children}</NavbarWrapper>
            </AuthGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

// Client component to conditionally render the navbar
function NavbarWrapper({ children }: { children: React.ReactNode }) {
  return <ClientNavbarWrapper>{children}</ClientNavbarWrapper>;
}

// This needs to be a separate client component to use usePathname
function ClientNavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/auth");

  return (
    <>
      {!isAuthPage && <AppHeader />}
      <main className="flex-1 flex justify-center items-center">
        {children}
      </main>
    </>
  );
}
