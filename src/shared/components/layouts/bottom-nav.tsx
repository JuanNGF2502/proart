"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Receipt,
  Package,
  Factory,
  Plus,
  Box,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Início" },
  { href: "/clients", icon: Users, label: "Clientes" },
  { href: "/products", icon: Box, label: "Produtos" },
  { href: "/budgets", icon: Receipt, label: "Orçamentos" },
  { href: "/orders", icon: Package, label: "Pedidos" },
  { href: "/production", icon: Factory, label: "Produção" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 md:hidden">
      <div className="flex items-center justify-between bg-gray-900 rounded-2xl px-2 py-2 safe-area-bottom shadow-xl shadow-gray-900/30">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[56px]",
                isActive
                  ? "bg-primary text-gray-900"
                  : "text-gray-400 hover:text-gray-200"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}

        {/* Quick Add FAB */}
        <Link
          href="/budgets/new"
          className="flex items-center justify-center w-11 h-11 bg-primary rounded-xl shadow-lg shadow-primary/30"
        >
          <Plus className="h-5 w-5 text-gray-900" />
        </Link>
      </div>
    </nav>
  );
}