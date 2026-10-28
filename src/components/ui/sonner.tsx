"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "!rounded-sm !border-3 !border-foreground !bg-secondary !text-secondary-foreground !shadow-hard-accent !font-sans !text-[15px] !font-semibold",
          error: "!bg-destructive !text-destructive-foreground",
        },
      }}
    />
  );
}
