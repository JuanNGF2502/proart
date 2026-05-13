"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "info" | "dark" | "gray";
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "gray", ...props }, ref) => {
    const variants = {
      success: "bg-success text-white",
      warning: "bg-warning text-black",
      danger: "bg-danger text-white",
      info: "bg-info text-white",
      dark: "bg-black text-primary",
      gray: "bg-gray-light text-gray",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
