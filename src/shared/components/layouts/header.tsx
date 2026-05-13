"use client";

import { Bell } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Header({ title, description, actions }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-200/50">
      <div className="flex h-16 items-center justify-between px-5">
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          {description && (
            <p className="text-xs text-gray-500 capitalize">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {actions}
          <Link
            href="/notifications"
            className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </Link>
        </div>
      </div>
    </header>
  );
}