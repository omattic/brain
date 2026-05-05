import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const variants = cva(
  "inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-brand bg-brand text-white hover:bg-brand/90",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "border-transparent bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        danger: "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90",
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
