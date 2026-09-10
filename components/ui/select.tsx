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
      "flex h-[54px] w-full items-center justify-between gap-3 rounded-[10px] border border-white/15 bg-white/[0.04] px-4 text-left text-[16px] font-medium leading-[1.4] text-[var(--secondary-light,#eeddb8)] outline-none transition-[background-color,color,border-color,box-shadow] duration-200 data-[placeholder]:text-[var(--secondary-light,#eeddb8)]/60 hover:border-[var(--secondary-light,#eeddb8)] hover:bg-[var(--secondary,#d2b885)] hover:text-[var(--primary-darkest,#2b0510)] hover:[&>span]:text-[var(--primary-darkest,#2b0510)] active:border-[var(--secondary-light,#eeddb8)] active:bg-[var(--secondary,#d2b885)] active:text-[var(--primary-darkest,#2b0510)] active:[&>span]:text-[var(--primary-darkest,#2b0510)] data-[state=open]:border-[var(--secondary-light,#eeddb8)] data-[state=open]:bg-[var(--secondary,#d2b885)] data-[state=open]:text-[var(--primary-darkest,#2b0510)] data-[state=open]:[&>span]:text-[var(--primary-darkest,#2b0510)]",
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
      "z-[10050] max-h-[min(24rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[16px] border border-[var(--secondary,#d2b885)] bg-[var(--primary-darkest,#2b0510)]/96 p-1.5 text-[var(--secondary-light,#eeddb8)] shadow-[0_18px_45px_rgba(0,0,0,.35),inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur-xl",
  className
)}
      {...props}
    >
      <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1 text-[var(--secondary-light,#eeddb8)]">
        <ChevronDown className="size-4 rotate-180" aria-hidden="true" />
      </SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="flex items-center justify-center py-1 text-[var(--secondary-light,#eeddb8)]">
        <ChevronDown className="size-4" aria-hidden="true" />
      </SelectPrimitive.ScrollDownButton>
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
      "relative flex w-full cursor-default select-none items-center rounded-[6px] px-4 py-3 pr-10 text-[15px] font-medium leading-[1.4] text-[var(--secondary-light,#eeddb8)] outline-none transition-[background-color,color] duration-200 focus:bg-[var(--secondary,#d2b885)] focus:text-[var(--primary-darkest,#2b0510)] data-[highlighted]:bg-[var(--secondary,#d2b885)] data-[highlighted]:text-[var(--primary-darkest,#2b0510)] data-[disabled]:pointer-events-none data-[disabled]:opacity-45",
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

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue };