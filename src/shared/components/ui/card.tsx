"use client";

import * as React from "react";
import { cn } from "@/shared/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "highlight";
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const styles = variant === "highlight"
      ? "bg-primary rounded-[24px] p-[18px] shadow-floating"
      : "bg-surface rounded-[24px] p-4 shadow-soft";

    return (
      <div
        ref={ref}
        className={cn(styles, className)}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

export { Card };
