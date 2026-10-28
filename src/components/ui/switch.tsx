"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-sm border-3 border-foreground bg-background p-[3px] data-[state=checked]:bg-primary disabled:cursor-not-allowed disabled:opacity-60",
      className,
    )}
    {...props}
  >
    <SwitchPrimitives.Thumb className="block size-5 rounded-sm border-2 border-foreground bg-foreground transition-transform data-[state=checked]:translate-x-6 data-[state=checked]:bg-background" />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
