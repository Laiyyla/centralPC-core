import React, { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, Terminal, Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  variant?: "orders" | "clients" | "catalog" | "search" | "default";
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  const getDefaultIcon = () => {
    switch (variant) {
      case "orders":
        return (
          <div className="relative">
            <Terminal className="size-8 text-primary transition-transform duration-300 group-hover:scale-110" />
            <Sparkles className="size-3.5 text-accent absolute -top-1 -right-1 animate-pulse" />
          </div>
        );
      case "search":
        return (
          <div className="relative">
            <Inbox className="size-8 text-primary transition-transform duration-300 group-hover:scale-110" />
            <span className="text-[10px] font-mono absolute -bottom-1 -right-2 text-accent font-bold">
              404
            </span>
          </div>
        );
      default:
        return (
          <div className="relative">
            <Sparkles className="size-8 text-accent animate-pulse" />
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "group flex flex-col items-center justify-center text-center py-12 px-4 transition-all",
        className
      )}
    >
      <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary/80 border border-primary/20 shadow-inner mb-4 transition-transform duration-300 group-hover:scale-105">
        {icon ?? getDefaultIcon()}
      </div>
      <h3 className="text-base font-semibold text-foreground tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
