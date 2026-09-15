import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const Select = SelectPrimitive.Root;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-[54px] w-full items-center justify-between gap-3 rounded-[10px] border border-white/15 bg-white/[0.04] px-4 text-left text-[16px] font-medium leading-[1.4] text-[var(--secondary-light)] outline-none transition-[background-color,color,border-color,box-shadow] duration-200 data-[placeholder]:text-[var(--secondary-light)]/60 hover:border-[var(--secondary-light)] hover:bg-[var(--secondary)] hover:text-[var(--primary-darkest)] hover:[&>span]:text-[var(--primary-darkest)] active:border-[var(--secondary-light)] active:bg-[var(--secondary)] active:text-[var(--primary-darkest)] active:[&>span]:text-[var(--primary-darkest)] data-[state=open]:border-[var(--secondary-light)] data-[state=open]:bg-[var(--secondary)] data-[state=open]:text-[var(--primary-darkest)] data-[state=open]:[&>span]:text-[var(--primary-darkest)]",
      className
    )}
    {...props}
  >
    {children}

    <SelectPrimitive.Icon>
      <ChevronDown
        className="size-4 shrink-0 text-current transition-transform duration-200 [[data-state=open]_&]:rotate-180"
        aria-hidden="true"
      />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));

SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      sideOffset={8}
      className={cn(
        "select-content",
        // Deliberately above every stacking context this can be portalled into —
        // the header/nav, AND the Quote modal overlay (z-[999999]). Radix portals
        // this content to <body>, so it must clear every fixed/sticky ancestor,
        // including full-screen dialogs that sit on top of the page.
        "z-[1000010] max-h-[min(24rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[16px] border border-[var(--secondary)] bg-[var(--primary-darkest)]/96 p-1.5 text-[var(--secondary-light)] shadow-[0_18px_45px_rgba(0,0,0,.35),inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur-xl",
        className
      )}
      {...props}
    >
     <SelectPrimitive.Viewport
  className={cn(
    "max-h-[min(24rem,var(--radix-select-content-available-height))] overflow-y-scroll overscroll-contain",
    "[scrollbar-gutter:stable]",
    "[scrollbar-width:thin]",
    "[scrollbar-color:var(--secondary)_transparent]",
    "[&::-webkit-scrollbar]:w-1.5",
    "[&::-webkit-scrollbar-track]:bg-transparent",
    "[&::-webkit-scrollbar-thumb]:rounded-full",
    "[&::-webkit-scrollbar-thumb]:bg-[var(--secondary)]",
    "[&::-webkit-scrollbar-thumb:hover]:bg-[var(--secondary-light)]"
  )}
>
  {children}
</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));

SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-[6px] px-4 py-3 pr-10 text-[15px] font-medium leading-[1.4] text-[var(--secondary-light)] outline-none transition-[background-color,color] duration-200 focus:bg-[var(--secondary)] focus:text-[var(--primary-darkest)] data-[highlighted]:bg-[var(--secondary)] data-[highlighted]:text-[var(--primary-darkest)] data-[disabled]:pointer-events-none data-[disabled]:opacity-45",
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>
      {children}
    </SelectPrimitive.ItemText>

    <SelectPrimitive.ItemIndicator className="absolute right-3 flex items-center justify-center">
      <Check
        className="size-4"
        strokeWidth={2.5}
        aria-hidden="true"
      />
    </SelectPrimitive.ItemIndicator>
  </SelectPrimitive.Item>
));

SelectItem.displayName = SelectPrimitive.Item.displayName;

export {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
};