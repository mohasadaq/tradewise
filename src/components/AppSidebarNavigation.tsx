
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, Bot } from "lucide-react";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarContent,
  useSidebar, // Import useSidebar
} from "@/components/ui/sidebar";

export default function AppSidebarNavigation() {
  const pathname = usePathname();
  const { setOpen, isMobile } = useSidebar(); // Get setOpen and isMobile from context

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
  ];

  const handleLinkClick = () => {
    if (!isMobile) {
      setOpen(false); // Collapse sidebar on desktop after navigation
    }
    // On mobile, the Sheet component handles its own closing
  };

  return (
    <>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Bot className="h-8 w-8 text-primary" />
          <h2 className="text-xl font-semibold text-primary group-data-[collapsible=icon]:hidden">TradeWise</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{ children: item.label, side: "right", align: "center" }}
              >
                <Link href={item.href} onClick={handleLinkClick}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2 group-data-[collapsible=icon]:hidden">
        <p className="text-xs text-muted-foreground text-center">
          &copy; {new Date().getFullYear()} TradeWise
        </p>
      </SidebarFooter>
    </>
  );
}
