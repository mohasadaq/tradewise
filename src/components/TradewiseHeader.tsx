
"use client";

import { Bot } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function TradewiseHeader() {
  return (
    <header className="py-4 px-2 sm:px-4 md:px-8 border-b border-border/50 shadow-md bg-card sticky top-0 z-40"> {/* z-index lower than sidebar */}
      <div className="container mx-auto flex items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <SidebarTrigger className="md:hidden" /> {/* Only show on mobile, desktop uses rail/icon collapse */}
          <Bot className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">TradeWise</h1>
        </div>
        {/* Desktop sidebar trigger is part of the Sidebar component itself (rail) */}
      </div>
    </header>
  );
}
