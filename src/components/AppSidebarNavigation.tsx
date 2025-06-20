
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, History } from "lucide-react"; // Added History icon
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarContent,
  useSidebar, 
} from "@/components/ui/sidebar";
import { Bot } from "lucide-react"; // Ensured Bot icon is imported

export default function AppSidebarNavigation() {
  const pathname = usePathname();
  const { setOpen, isMobile, open: sidebarOpen, setOpenMobile } = useSidebar(); 

  const menuItems = [
    {
      href: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/portfolio",
      label: "Portfolio",
      icon: Briefcase,
    },
    {
      href: "/backtesting", // New Backtesting menu item
      label: "Backtesting",
      icon: History,
    },
  ];

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false); // Close sheet on mobile
    } else {
      // If it was manually expanded by user, then clicking collapses it.
      if (sidebarOpen) {
        setOpen(false);
      }
    }
  };

  return (
    <>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Bot className="h-7 w-7 sm:h-8 sm:w-8 text-primary shrink-0" />
          <h2 className="text-lg sm:text-xl font-semibold text-primary group-data-[collapsible=icon]:hidden whitespace-nowrap">TradeWise</h2>
        </div>
      </SidebarHeader>
      <SidebarContent className="py-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{ children: item.label, side: "right", align: "center" }}
                onClick={handleLinkClick} 
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 mt-auto border-t border-sidebar-border group-data-[collapsible=icon]:hidden">
        <p className="text-xs text-muted-foreground text-center">
          &copy; {new Date().getFullYear()} TradeWise
        </p>
      </SidebarFooter>
    </>
  );
}
