import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      "flex h-[54px] w-full rounded-lg border-3 border-input bg-white px-3.5 text-base text-[#141210] placeholder:text-[#6b6058] focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-destructive aria-[invalid=true]:shadow-[4px_4px_0_0_hsl(var(--destructive))] file:border-0 file:bg-transparent file:font-bold",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
