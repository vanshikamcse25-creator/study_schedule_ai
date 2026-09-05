"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ChatWidget } from "@/components/chat/chat-widget";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060810] text-slate-900 dark:text-[#F8FAFC] transition-colors duration-300">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <TopNavbar />
        <main className="flex-1 p-4 pb-24 lg:p-6 lg:pb-6 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <MobileNav />
      <ChatWidget />
    </div>
  );
}
