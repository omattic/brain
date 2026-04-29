import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const variants = cva(
  "inline-flex min-h-10 items-center justify-center rounded-xl border px-3.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635bff]/30 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-[#635bff] bg-[#635bff] text-white hover:bg-[#564fe1]",
        secondary: "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        ghost: "border-transparent bg-transparent text-slate-600 hover:bg-slate-100",
        danger: "border-rose-600 bg-rose-600 text-white hover:bg-rose-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variants> {}

export function Button({ className, variant, ...props }: ButtonProps) {
  return <button className={cn(variants({ variant }), className)} {...props} />;
}
