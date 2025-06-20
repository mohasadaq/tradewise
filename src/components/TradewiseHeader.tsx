
"use client";

import { Bot } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function TradewiseHeader() {
  return (
    <header 
      className="py-0 px-2 sm:px-4 border-b border-border/50 shadow-md bg-card sticky top-0 z-30" 
      style={{ height: 'var(--header-height)' }}
    >
      <div className="container mx-auto flex items-center justify-between h-full gap-2 sm:gap-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <SidebarTrigger className="md:hidden -ml-1 sm:-ml-2" /> 
          <Bot className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold text-primary">TradeWise</h1>
        </div>
      </div>
    </header>
  );
}
