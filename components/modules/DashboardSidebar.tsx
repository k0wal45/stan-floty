"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Box, CalendarDays, ChevronLeft, ChevronRight, LogOut, Settings } from "lucide-react";
import { logout } from "@/server/actions/auth";

const navItems = [
  { href: "/panel", label: "Pulpit", icon: LayoutDashboard },
  { href: "/przedmioty", label: "Zasoby", icon: Box },
  { href: "/wypozyczenia", label: "Wypożyczenia", icon: CalendarDays },
  { href: "/ustawienia", label: "Ustawienia", icon: Settings },
];

export function DashboardSidebar({ user }: { user: { fullName: string; role: string } }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex flex-col border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b px-4">
        {!collapsed && <span className="text-lg font-semibold tracking-tight truncate">Stan Floty</span>}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("h-8 w-8", collapsed && "mx-auto")}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 space-y-2 p-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
                isActive ? "bg-muted text-foreground" : "text-muted-foreground",
                collapsed && "justify-center px-0"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex flex-col truncate pr-2">
              <span className="text-sm font-medium truncate">{user.fullName}</span>
              <span className="text-xs text-muted-foreground">{user.role}</span>
            </div>
            <form action={logout}>
              <Button variant="ghost" size="icon" type="submit" title="Wyloguj">
                <LogOut className="h-4 w-4 text-muted-foreground" />
              </Button>
            </form>
          </div>
        ) : (
          <form action={logout} className="flex justify-center">
            <Button variant="ghost" size="icon" type="submit" title="Wyloguj">
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}