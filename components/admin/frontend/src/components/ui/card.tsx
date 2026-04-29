import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/50 bg-white/88 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur",
        className
      )}
      {...props}
    />
  );
}
