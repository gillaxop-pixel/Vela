import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export const SheetContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { side?: "left" | "right" | "bottom" }
>(({ className, side = "left", children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/70 data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed z-50 bg-card shadow-[var(--shadow-border)] outline-none data-[state=open]:animate-in data-[state=closed]:animate-out",
        side === "left" && "inset-y-0 left-0 w-[min(86vw,300px)] rounded-r-2xl data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
        side === "right" && "inset-y-0 right-0 w-[min(86vw,360px)] rounded-l-2xl data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right",
        side === "bottom" && "inset-x-0 bottom-0 rounded-t-2xl data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
SheetContent.displayName = "SheetContent";
