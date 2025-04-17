import Link from "next/link";
import { MainNav } from "@/components/main-nav";
import { ModeToggle } from "@/components/mode-toggle";
import { Dumbbell } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background flex justify-center">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Dumbbell className="h-6 w-6" />
          <span className="text-xl font-bold">GymPlanner</span>
        </Link>
        <div className="flex items-center space-x-4">
          <MainNav />
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
