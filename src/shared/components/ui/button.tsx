"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "full";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles = "font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2";

    const variants = {
      primary: "bg-black text-white hover:bg-black/90",
      secondary: "bg-primary text-black hover:bg-primary-dark",
      outline: "bg-transparent text-black border border-gray-light hover:bg-gray-light",
      ghost: "bg-transparent text-gray hover:bg-gray-light hover:text-black",
      danger: "bg-danger text-white hover:bg-danger/90",
    };

    const sizes = {
      sm: "h-10 px-4 rounded-xl text-sm",
      md: "h-12 px-5 rounded-xl text-base",
      lg: "h-14 px-6 rounded-xl text-base",
      full: "h-14 w-full rounded-xl text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button };
