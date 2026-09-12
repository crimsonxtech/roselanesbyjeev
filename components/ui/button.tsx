import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  asChild?: boolean;
}

const buttonBase =
  [
    // Layout
    "relative",
    "isolate",
    "overflow-hidden",
    "inline-flex",
    "items-center",
    "justify-center",
    "w-fit",
    "max-w-full",
    "[flex:0_0_auto]",

    // Size
    "min-w-[170px]",
    "min-h-[60px]",
    "px-[34px]",

    // Border
    "border",
    "border-[var(--secondary)]/45",
    "rounded-[999px]",

    // Typography
    "[font-family:inherit]",
    "text-[.88rem]",
    "font-semibold",
    "leading-none",
    "tracking-[.14em]",
    "uppercase",
    "whitespace-nowrap",
    "no-underline",

    // Interaction
    "cursor-pointer",

    // Backdrop
    "[backdrop-filter:blur(18px)_saturate(180%)]",
    "[-webkit-backdrop-filter:blur(18px)_saturate(180%)]",

    // Base shadow
    "[box-shadow:0_5px_14px_color-mix(in_srgb,var(--primary-darkest)_10%,transparent),0_14px_30px_color-mix(in_srgb,var(--primary-darkest)_7%,transparent),inset_0_1px_0_rgba(255,255,255,.42),inset_0_-1px_0_color-mix(in_srgb,var(--primary-dark)_8%,transparent)]",

    // Base transform
    "translate-y-0",

    // Base transitions
    "transition-[transform,background,color,border-color,box-shadow]",
    "duration-[.35s]",
    "ease",
  ].join(" ");

const glassEffects =
  [
    // ==================================================
    // ::before — GLASS HIGHLIGHT
    // ==================================================

    "before:content-['']",
    "before:absolute",
    "before:inset-0",
    "before:-z-[1]",
    "before:pointer-events-none",

    "before:[background:radial-gradient(circle_at_18%_8%,rgba(255,255,255,.42),transparent_28%),radial-gradient(circle_at_85%_100%,color-mix(in_srgb,var(--secondary)_14%,transparent),transparent_42%),linear-gradient(125deg,transparent_20%,rgba(255,255,255,.08)_48%,color-mix(in_srgb,var(--secondary)_10%,transparent)_55%,transparent_80%)]",

    "before:opacity-[.85]",
    "before:-translate-x-[35%]",

    "before:transition-[transform,opacity]",
    "before:duration-[.8s]",
    "before:ease",

    // ==================================================
    // ::after — GLASS LIGHT SWEEP
    // ==================================================

    "after:content-['']",
    "after:absolute",
    "after:-top-[140%]",
    "after:-left-[55%]",
    "after:w-[60%]",
    "after:h-[340%]",
    "after:rounded-[999px]",
    "after:pointer-events-none",

    "after:[background:radial-gradient(circle,rgba(255,255,255,.25),transparent_72%)]",

    "after:blur-[24px]",
    "after:-rotate-[22deg]",

    "after:transition-[left]",
    "after:duration-[1s]",
    "after:ease",
  ].join(" ");

const primaryVariant =
  [
    // Color
    "text-[var(--primary-darkest)]",

    // Background
    "[background:linear-gradient(145deg,rgba(255,255,255,.30)_0%,rgba(255,255,255,.10)_38%,color-mix(in_srgb,var(--secondary)_10%,transparent)_100%),var(--secondary)]",

    // Border
    "border-[var(--secondary)]/62",

    // Shadow
    "[box-shadow:0_5px_14px_color-mix(in_srgb,var(--primary-darkest)_10%,transparent),0_14px_30px_color-mix(in_srgb,var(--primary-darkest)_7%,transparent),inset_0_1px_0_rgba(255,255,255,.42),inset_0_-1px_0_color-mix(in_srgb,var(--primary-dark)_8%,transparent),0_0_18px_color-mix(in_srgb,var(--secondary)_6%,transparent)]",

    // Primary hover
    "hover:not-disabled:text-[var(--primary-darkest)]",

    "hover:not-disabled:[background:linear-gradient(135deg,rgba(255,255,255,.22),rgba(255,255,255,.06)),var(--secondary-light)]",

    "hover:not-disabled:border-[var(--secondary-light)]",

    "hover:not-disabled:[box-shadow:0_10px_22px_color-mix(in_srgb,var(--primary-darkest)_14%,transparent),0_18px_42px_color-mix(in_srgb,var(--secondary)_18%,transparent)]",
  ].join(" ");

const secondaryVariant =
  [
    // Color
    "text-[var(--cream)]",

    // Background
    "[background:linear-gradient(135deg,rgba(255,255,255,.12),rgba(255,255,255,.03)),color-mix(in_srgb,var(--primary)_25%,transparent)]",

    // Secondary hover
    "hover:not-disabled:text-[var(--secondary-light)]",

    "hover:not-disabled:[background:linear-gradient(135deg,rgba(255,255,255,.16),rgba(255,255,255,.04)),color-mix(in_srgb,var(--primary)_30%,transparent)]",

    "hover:not-disabled:border-[var(--secondary)]",

    "hover:not-disabled:[box-shadow:0_8px_20px_color-mix(in_srgb,var(--primary-darkest)_12%,transparent),0_16px_34px_color-mix(in_srgb,var(--primary-darkest)_8%,transparent)]",
  ].join(" ");

const interaction =
  [
    // ==================================================
    // HOVER EFFECT
    // ==================================================

    "hover:not-disabled:-translate-y-[3px]",

    "hover:not-disabled:before:opacity-100",
    "hover:not-disabled:before:translate-x-[35%]",

    "hover:not-disabled:after:left-[110%]",

    // ==================================================
    // ACTIVE
    // ==================================================

    "active:not-disabled:translate-y-0",

    // ==================================================
    // FOCUS
    // ==================================================

    "focus-visible:outline-none",
    "focus-visible:[box-shadow:0_0_0_4px_color-mix(in_srgb,var(--secondary)_14%,transparent),0_10px_24px_color-mix(in_srgb,var(--primary-darkest)_14%,transparent)]",

    // ==================================================
    // DISABLED
    // ==================================================

    "disabled:opacity-70",
    "disabled:cursor-default",
    "disabled:transform-none",
    "disabled:[box-shadow:none]",

    // ==================================================
    // SVG / ICON
    // ==================================================

    "[&_svg]:shrink-0",
    "[&_svg]:size-[14px]",
    "[&_svg]:transition-transform",
    "[&_svg]:duration-[.35s]",
    "[&_svg]:ease",

    "hover:not-disabled:[&_svg]:translate-x-[3px]",
    "hover:not-disabled:[&_svg]:-translate-y-[3px]",

    // ==================================================
    // REDUCED MOTION
    // ==================================================

    "motion-reduce:transition-none",
    "motion-reduce:before:transition-none",
    "motion-reduce:after:transition-none",
    "motion-reduce:[&_svg]:transition-none",

    "motion-reduce:hover:not-disabled:transform-none",
    "motion-reduce:hover:not-disabled:before:transform-none",
    "motion-reduce:hover:not-disabled:after:transform-none",
    "motion-reduce:hover:not-disabled:[&_svg]:transform-none",
  ].join(" ");

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      asChild = false,
      type,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type ?? "button"}
        className={cn(
          buttonBase,
          glassEffects,
          variant === "primary"
            ? primaryVariant
            : secondaryVariant,
          interaction,
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };