"use client";

import { BottomNav } from "./bottom-nav";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {children}
      <BottomNav />
    </div>
  );
}