"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/* =========================================================
   STYLES
   =========================================================
   Ported 1:1 from the original button.css. Color tokens
   (--primary-darkest, --secondary, --secondary-light, --cream)
   read from your globals.css :root — they already exist there
   with the same values. Structural tokens that your globals.css
   doesn't define (radius, blur, saturate, timing) are inlined
   below so this component has zero external CSS dependencies.
========================================================= */

const BUTTON_CSS = `
.btn-root {
    /* ------------------------------
       SIZE
       Fluid between mobile and desktop using clamp() so the
       button scales with viewport width instead of jumping
       at fixed breakpoints.
    ------------------------------ */
    --btn-min-width: clamp(0px, 30vw, 170px);
    --btn-min-height: clamp(46px, 6vw + 30px, 60px);
    --btn-padding-x: clamp(16px, 4vw, 34px);
    --btn-radius: 999px;
    --btn-gap: clamp(6px, 1.2vw, 10px);

    /* ------------------------------
       TYPOGRAPHY
    ------------------------------ */
    --btn-font-size: clamp(.68rem, .58rem + .5vw, .88rem);
    --btn-font-weight: 600;
    --btn-letter-spacing: clamp(.04em, .02em + .3vw, .14em);

    /* ------------------------------
       PRIMARY
    ------------------------------ */
    --btn-primary-text: var(--primary-darkest);
    --btn-primary-bg: var(--secondary);
    --btn-primary-hover-bg: var(--secondary-light);

    /* ------------------------------
       SECONDARY
    ------------------------------ */
    --btn-secondary-text: var(--cream);
    --btn-secondary-bg: rgba(131, 17, 50, .25);
    --btn-secondary-hover-bg: rgba(131, 17, 50, .30);

    /* ------------------------------
       GLASS
    ------------------------------ */
    --btn-blur: 18px;
    --btn-saturate: 180%;
    --btn-highlight: rgba(255, 255, 255, .34);
    --btn-gold-light: rgba(210, 184, 133, .18);
    --btn-glass-light: rgba(255, 255, 255, .25);

    /* ------------------------------
       BORDER
    ------------------------------ */
    --btn-border: rgba(210, 184, 133, .45);
    --btn-primary-hover-border: var(--secondary-light);
    --btn-secondary-hover-border: var(--secondary);

    /* ------------------------------
       SHADOW
    ------------------------------ */
    --btn-shadow:
        0 5px 14px rgba(38, 7, 17, .10),
        0 14px 30px rgba(38, 7, 17, .07),
        inset 0 1px 0 rgba(255, 255, 255, .42),
        inset 0 -1px 0 rgba(92, 12, 36, .08);

    --btn-primary-hover-shadow:
        0 10px 22px rgba(38, 7, 17, .14),
        0 18px 42px rgba(210, 184, 133, .18);

    --btn-secondary-hover-shadow:
        0 8px 20px rgba(38, 7, 17, .12),
        0 16px 34px rgba(38, 7, 17, .08);

    /* ------------------------------
       MOTION
    ------------------------------ */
    --btn-hover-y: -3px;
    --btn-transition: .35s ease;
    --btn-glass-transition: .8s ease;
    --btn-sweep-transition: 1s ease;
}

/*
 * Extra-small screens: tighten the fluid values further so the
 * pill never forces horizontal overflow when two buttons sit
 * side-by-side in a narrow flex row (e.g. inside a phone-width
 * hero CTA group).
 */
@media (max-width: 420px) {
    .btn-root {
        --btn-min-width: 0px;
        --btn-min-height: 44px;
        --btn-padding-x: 14px;
        --btn-gap: 5px;
        --btn-font-size: .64rem;
        --btn-letter-spacing: .03em;
    }
}

.btn {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    box-sizing: border-box;

    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--btn-gap);

    width: fit-content;
    max-width: 100%;
    flex: 0 0 auto;

    min-width: var(--btn-min-width);
    min-height: var(--btn-min-height);

    padding-inline: var(--btn-padding-x);

    border: 1px solid var(--btn-border);
    border-radius: var(--btn-radius);

    font-family: inherit;
    font-size: var(--btn-font-size);
    font-weight: var(--btn-font-weight);
    line-height: 1;
    letter-spacing: var(--btn-letter-spacing);

    text-transform: uppercase;
    white-space: nowrap;
    text-overflow: ellipsis;
    text-decoration: none;

    cursor: pointer;

    backdrop-filter: blur(var(--btn-blur)) saturate(var(--btn-saturate));
    -webkit-backdrop-filter: blur(var(--btn-blur)) saturate(var(--btn-saturate));

    box-shadow: var(--btn-shadow);

    transform: translateY(0);

    transition:
        transform var(--btn-transition),
        background var(--btn-transition),
        color var(--btn-transition),
        border-color var(--btn-transition),
        box-shadow var(--btn-transition);
}

.btn::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;

    background:
        radial-gradient(circle at 18% 8%, rgba(255, 255, 255, .42), transparent 28%),
        radial-gradient(circle at 85% 100%, rgba(210, 184, 133, .14), transparent 42%),
        linear-gradient(
            125deg,
            transparent 20%,
            rgba(255, 255, 255, .08) 48%,
            rgba(210, 184, 133, .10) 55%,
            transparent 80%
        );

    opacity: .85;
    transform: translateX(-35%);

    transition:
        transform var(--btn-glass-transition),
        opacity var(--btn-transition);
}

.btn::after {
    content: "";
    position: absolute;

    top: -140%;
    left: -55%;
    width: 60%;
    height: 340%;

    border-radius: var(--btn-radius);
    pointer-events: none;

    background: radial-gradient(circle, var(--btn-glass-light), transparent 72%);
    filter: blur(24px);
    transform: rotate(-22deg);

    transition: left var(--btn-sweep-transition);
}

.btn-primary {
    color: var(--btn-primary-text);

    background:
        linear-gradient(
            145deg,
            rgba(255, 255, 255, .30) 0%,
            rgba(255, 255, 255, .10) 38%,
            rgba(210, 184, 133, .10) 100%
        ),
        var(--btn-primary-bg);

    border-color: rgba(210, 184, 133, .62);

    box-shadow: var(--btn-shadow), 0 0 18px rgba(210, 184, 133, .06);
}

.btn-primary:hover:not(:disabled) {
    color: var(--btn-primary-text);

    background:
        linear-gradient(135deg, rgba(255, 255, 255, .22), rgba(255, 255, 255, .06)),
        var(--btn-primary-hover-bg);

    border-color: var(--btn-primary-hover-border);
    box-shadow: var(--btn-primary-hover-shadow);
}

.btn-secondary {
    color: var(--btn-secondary-text);

    background:
        linear-gradient(135deg, rgba(255, 255, 255, .12), rgba(255, 255, 255, .03)),
        var(--btn-secondary-bg);
}

.btn-secondary:hover:not(:disabled) {
    color: var(--secondary-light);

    background:
        linear-gradient(135deg, rgba(255, 255, 255, .16), rgba(255, 255, 255, .04)),
        var(--btn-secondary-hover-bg);

    border-color: var(--btn-secondary-hover-border);
    box-shadow: var(--btn-secondary-hover-shadow);
}

.btn:hover:not(:disabled) {
    transform: translateY(var(--btn-hover-y));
}

.btn:hover:not(:disabled)::before {
    opacity: 1;
    transform: translateX(35%);
}

.btn:hover:not(:disabled)::after {
    left: 110%;
}

.btn:active:not(:disabled) {
    transform: translateY(0);
}

.btn:focus-visible {
    outline: none;
    box-shadow:
        0 0 0 4px rgba(210, 184, 133, .14),
        0 10px 24px rgba(38, 7, 17, .14);
}

.btn:disabled {
    opacity: .7;
    cursor: default;
    transform: none;
    box-shadow: none;
}

.btn svg {
    flex: 0 0 auto;
    width: clamp(11px, 1.6vw, 14px);
    height: clamp(11px, 1.6vw, 14px);
    transition: transform var(--btn-transition);
}

.btn:hover:not(:disabled) svg {
    transform: translate(3px, -3px);
}

@media (prefers-reduced-motion: reduce) {
    .btn,
    .btn::before,
    .btn::after,
    .btn svg {
        transition: none;
    }

    .btn:hover:not(:disabled) {
        transform: none;
    }

    .btn:hover:not(:disabled) svg {
        transform: none;
    }
}
`

const STYLE_ELEMENT_ID = "btn-component-styles"

/**
 * Injects BUTTON_CSS into <head> exactly once, no matter how many
 * <Button> instances are mounted. Runs on the client only; since
 * the rules are static and idempotent there's no hydration mismatch.
 */
function useInjectButtonStyles() {
  React.useEffect(() => {
    if (typeof document === "undefined") return
    if (document.getElementById(STYLE_ELEMENT_ID)) return

    const style = document.createElement("style")
    style.id = STYLE_ELEMENT_ID
    style.textContent = BUTTON_CSS
    document.head.appendChild(style)
  }, [])
}

/* =========================================================
   COMPONENT
========================================================= */

const buttonVariants = cva("btn btn-root", {
  variants: {
    variant: {
      primary: "btn-primary",
      secondary: "btn-secondary",
    },
    fullWidth: {
      true: "!w-full",
      false: "",
    },
  },
  defaultVariants: {
    variant: "primary",
    fullWidth: false,
  },
})

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Render as the passed child (Radix Slot) instead of a <button>,
   * e.g. <Button asChild><a href="/contact">Contact</a></Button>
   */
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, fullWidth, asChild = false, ...props }, ref) => {
    useInjectButtonStyles()

    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        className={cn(buttonVariants({ variant, fullWidth }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }