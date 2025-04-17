"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { BarChart3, Calendar, Dumbbell, Home, LogOut } from "lucide-react"

const navItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    name: "Templates",
    href: "/templates",
    icon: Dumbbell,
  },
  {
    name: "Schedule",
    href: "/schedule",
    icon: Calendar,
  },
  {
    name: "Progress",
    href: "/progress",
    icon: BarChart3,
  },
]

export function MainNav() {
  const pathname = usePathname()
  const { signOut } = useAuth()

  return (
    <nav className="flex items-center space-x-4 lg:space-x-6">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center text-sm font-medium transition-colors hover:text-primary",
            pathname === item.href ? "text-primary" : "text-muted-foreground",
          )}
        >
          <item.icon className="mr-2 h-4 w-4" />
          {item.name}
        </Link>
      ))}
      <Button variant="ghost" size="sm" onClick={() => signOut()}>
        <LogOut className="mr-2 h-4 w-4" />
        Sign out
      </Button>
    </nav>
  )
}
