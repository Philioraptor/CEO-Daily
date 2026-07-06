"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  // Hide nav on the active scenario screens or summary screen to keep focus?
  // PRD: "Persistent bottom navigation: three destinations only — Home, Leaderboard, Profile — always visible so the daily loop never requires more than one tap to resume."
  // Wait, scenario flow says: "no back navigation once an option is tapped."
  // For safety, we keep it visible on main tabs. If they are in a scenario, maybe we should hide it? The PRD says "always visible", so we'll keep it simple.

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
    { name: "Profile", href: "/profile", icon: User },
  ];

  return (
    <nav className="absolute bottom-0 left-0 right-0 z-50 bg-[var(--color-bg-panel)]/80 backdrop-blur-lg border-t border-white/10 pb-safe">
      <div className="flex justify-around items-center h-16 w-full px-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                isActive ? "text-[var(--color-accent-primary)]" : "text-white/50 hover:text-white/80"
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
