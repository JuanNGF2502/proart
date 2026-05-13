"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Receipt,
  Package,
  Factory,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/clients", icon: Users, label: "Clientes" },
  { href: "/budgets", icon: Receipt, label: "Orçamentos" },
  { href: "/orders", icon: Package, label: "Pedidos" },
  { href: "/production", icon: Factory, label: "Produção" },
];

const bottomItems = [
  { href: "/notifications", icon: Bell, label: "Notificações" },
  { href: "/settings", icon: Settings, label: "Configurações" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };
    <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-surface border-r border-gray-light flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 p-6 border-b border-gray-light">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <span className="text-black font-bold text-lg">P</span>
        </div>
        <span className="text-h3 font-bold text-black">Proart</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold",
                isActive
                  ? "bg-black text-white"
                  : "text-gray hover:bg-gray-light"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 space-y-2 border-t border-gray-light">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold",
                isActive ? "bg-black text-white" : "text-gray hover:bg-gray-light"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-danger hover:bg-red-50 w-full"
        >
          <LogOut className="h-5 w-5" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
