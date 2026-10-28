import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border-3 border-foreground font-sans font-black uppercase tracking-wide transition-[transform,box-shadow] active:translate-x-1 active:translate-y-1 active:shadow-none disabled:pointer-events-none disabled:border-dashed disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-hard",
        secondary: "bg-secondary text-secondary-foreground shadow-hard-primary",
        outline: "bg-background text-foreground shadow-hard",
        accent: "bg-accent text-accent-foreground shadow-hard",
        destructive: "bg-destructive text-destructive-foreground shadow-hard",
        ghost: "border-transparent bg-transparent underline-offset-4 hover:underline active:translate-x-0 active:translate-y-0",
        link: "border-0 bg-transparent p-0 normal-case tracking-normal underline underline-offset-4",
      },
      size: {
        default: "h-12 px-5 text-[15px]",
        sm: "h-11 px-3 text-[13px] shadow-hard-sm",
        lg: "h-14 px-6 text-base",
        xl: "h-16 px-7 text-lg",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
