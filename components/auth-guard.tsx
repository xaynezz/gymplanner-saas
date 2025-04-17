"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { Loader2 } from "lucide-react"

const publicRoutes = ["/auth/login", "/auth/register"]

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading) {
      // If not authenticated and not on a public route, redirect to login
      if (!user && !publicRoutes.includes(pathname || "")) {
        router.push("/auth/login")
      }

      // If authenticated and on a public route, redirect to dashboard
      if (user && publicRoutes.includes(pathname || "")) {
        router.push("/dashboard")
      }
    }
  }, [user, isLoading, pathname, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Only render children if user is authenticated or on a public route
  if (user || publicRoutes.includes(pathname || "")) {
    return <>{children}</>
  }

  return null
}
