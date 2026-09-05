"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  CalendarDays,
  CheckSquare,
  BarChart3,
  GraduationCap,
  MessageSquare,
  Settings,
  User,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/subjects", label: "My Subjects", icon: BookOpen },
  { href: "/study-plan", label: "Study Plan", icon: Calendar },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/progress", label: "Progress", icon: BarChart3 },
  { href: "/exams", label: "Exams & Deadlines", icon: GraduationCap },
  { href: "/assistant", label: "AI Assistant", icon: MessageSquare },
];

const bottomItems = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/profile", label: "Profile", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setMobileOpen((prev) => !prev);
    window.addEventListener("toggle-mobile-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-mobile-sidebar", handleToggle);
  }, []);

  const NavContent = () => (
    <>
      <div className="flex h-14 items-center justify-between border-b border-border dark:border-white/10 px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-md shadow-indigo-500/25">
            <Sparkles className="h-3.5 w-3.5 text-white animate-pulse" />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">
            StudyFlow <span className="text-indigo-500 dark:text-indigo-400">AI</span>
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => setMobileOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="relative block"
            >
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 relative overflow-hidden",
                  active
                    ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-500/30 shadow-sm"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute left-0 top-1 bottom-1 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-r-full"
                  />
                )}
                <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground")} />
                <span>{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border dark:border-white/10 p-3 space-y-1">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="relative block"
            >
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 relative",
                  active
                    ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-bold border border-indigo-500/30"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute left-0 top-1 bottom-1 w-1 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-r-full"
                  />
                )}
                <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground")} />
                <span>{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </>
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border dark:border-white/10 bg-card/95 dark:bg-[#0B1020]/95 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:translate-x-0",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <NavContent />
      </aside>

      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-56 lg:flex-col lg:border-r lg:border-border dark:lg:border-white/10 lg:bg-card/95 dark:lg:bg-[#0B1020]/90 lg:backdrop-blur-xl">
        <NavContent />
      </aside>
    </>
  );
}
