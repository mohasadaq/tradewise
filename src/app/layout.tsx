
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { SidebarProvider, Sidebar, SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import AppSidebarNavigation from '@/components/AppSidebarNavigation';
import TradewiseHeader from '@/components/TradewiseHeader';

export const metadata: Metadata = {
  title: 'TradeWise - AI Crypto Trading Analysis',
  description: 'AI-powered crypto trading analysis with entry and exit price predictions.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <SidebarProvider defaultOpen={false}> {/* Sidebar collapsed by default on desktop */}
          <div className="flex min-h-screen">
            <Sidebar side="left" variant="sidebar" collapsible="icon">
              <AppSidebarNavigation />
              <SidebarRail />
            </Sidebar>
            <SidebarInset className="flex flex-col flex-grow">
              <TradewiseHeader />
              <div className="flex-grow overflow-y-auto"> {/* Main content scrollable area */}
                {children}
              </div>
            </SidebarInset>
          </div>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  );
}
