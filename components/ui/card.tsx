"use client";

import * as React from "react";

/* =====================================================================
   useTapCard
   ---------------------------------------------------------------------
   Shared logic for any card/visual that needs to LOOK like it's being
   hovered when a touch user taps it, get the same look on keyboard
   focus, and reset itself the instant the user taps or focuses
   anything else — anywhere on the page, not just inside its own
   section.

   Each section calls this once with a unique `group` name. That name
   scopes the "tap outside resets it" check, so About's cards and
   Contact's cards never interfere with each other's state.
===================================================================== */

export interface UseTapCardOptions {
  /** Unique per section/list, e.g. "about" or "contact". */
  group: string;
}

export function useTapCard<T extends string>({ group }: UseTapCardOptions) {
  const [active, setActive] = React.useState<T | null>(null);
  const lastPointerType = React.useRef<string>("mouse");
  // Guards against a documented WebKit quirk where a div with
  // role="button" + tabIndex can fire the `click` event TWICE for a
  // single tap on iOS/mobile Safari. Without this, that duplicate
  // click immediately re-toggles the card closed, showing up as an
  // instant "flash open, snap shut" with no visible animation.
  const lastToggleAt = React.useRef(0);

  const recordPointerType = React.useCallback((event: React.PointerEvent) => {
    lastPointerType.current = event.pointerType;
  }, []);

  const toggle = React.useCallback(
    (id: T) => () => {
      // Only touch taps simulate "hover" this way — real mice/trackpads
      // already get the effect for free via CSS :hover.
      if (lastPointerType.current !== "touch") return;

      const now = Date.now();
      if (now - lastToggleAt.current < 350) return;
      lastToggleAt.current = now;

      setActive((current) => (current === id ? null : id));
    },
    []
  );

  const activateOnKeyDown = React.useCallback(
    (id: T) => (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setActive((current) => (current === id ? null : id));
      }
    },
    []
  );

  // Tapping ANYWHERE else on the page — a different section, the nav,
  // another card group entirely — clears whatever is active in this
  // group, so nothing ever gets stuck mid-"hover".
  React.useEffect(() => {
    if (!active) return;

    const selector = `[data-tap-group="${group}"]`;

    const handleOutsideTap = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;
      // Same cooldown as above: don't let a trailing duplicate event
      // from the gesture that just opened this card slam it shut.
      if (Date.now() - lastToggleAt.current < 350) return;
      const target = event.target as HTMLElement;
      if (target.closest(selector)) return;
      setActive(null);
    };

    document.addEventListener("pointerdown", handleOutsideTap);
    return () => document.removeEventListener("pointerdown", handleOutsideTap);
  }, [active, group]);

  /**
   * Spread onto a card that is ITSELF the interactive target — i.e. it
   * has no focusable element (link/button/input) nested inside it.
   * Adds role="button", keyboard support, and aria-pressed.
   */
  const getInteractiveCardProps = (id: T) => ({
    "data-tap-group": group,
    role: "button" as const,
    tabIndex: 0,
    "aria-pressed": active === id,
    onPointerDown: recordPointerType,
    onClick: toggle(id),
    onKeyDown: activateOnKeyDown(id),
  });

  /**
   * Spread onto a card that WRAPS its own focusable element (a real
   * link/button/input). Deliberately has no role/tabIndex — nesting an
   * interactive role inside a real interactive element is invalid.
   * Keyboard parity instead comes from `focus-within:` classes on the
   * card, reacting to the real focusable child.
   */
  const getWrapperCardProps = (id: T) => ({
    "data-tap-group": group,
    onPointerDown: recordPointerType,
    onClick: toggle(id),
  });

  return {
    active,
    setActive,
    getInteractiveCardProps,
    getWrapperCardProps,
  };
}

/* =====================================================================
   Shared visual pieces
===================================================================== */

/** The lift / gold-border / shadow look shared by every card, on
 * mouse hover, touch-simulated "active", keyboard focus (via
 * :focus-visible for self-interactive cards, :focus-within for
 * wrapper cards), and reduced-motion fallback. */
/** Only apply CSS :hover on devices that genuinely support hovering
 * (a real mouse/trackpad). On touch, browsers simulate :hover on tap
 * in inconsistent, often-sticky-then-cleared ways — which was racing
 * against the JS `active` state from useTapCard and caused the
 * flicker/"vanish" glitch on mobile taps. Gating it here means touch
 * devices are driven ONLY by `active`, with one clean source of truth. */
const FINE_HOVER = "[@media(hover:hover)]:[@media(pointer:fine)]:hover";

export function hoverActiveClasses(active: boolean) {
  return `
    cursor-pointer
    outline-none
    transition-[transform,border-color,box-shadow]
    duration-[650ms]
    ease-[cubic-bezier(0.16,1,0.3,1)]
    will-change-transform
    ${FINE_HOVER}:-translate-y-1
    ${FINE_HOVER}:border-[var(--secondary)]/35
    ${FINE_HOVER}:shadow-[0_25px_55px_rgba(0,0,0,.38)]
    focus-visible:-translate-y-1
    focus-visible:border-[var(--secondary)]/35
    focus-visible:shadow-[0_25px_55px_rgba(0,0,0,.38)]
    focus-visible:ring-2
    focus-visible:ring-[var(--secondary-light)]
    focus-visible:ring-offset-2
    focus-visible:ring-offset-transparent
    focus-within:-translate-y-1
    focus-within:border-[var(--secondary)]/35
    focus-within:shadow-[0_25px_55px_rgba(0,0,0,.38)]
    motion-reduce:transition-none
    motion-reduce:${FINE_HOVER}:translate-y-0
    ${
      active
        ? "-translate-y-1 border-[var(--secondary)]/35 shadow-[0_25px_55px_rgba(0,0,0,.38)]"
        : ""
    }
  `;
}

/** The gold corner-bracket decoration used on Contact's cards. */
export function CornerAccents({ active }: { active: boolean }) {
  return (
    <>
      <span
        aria-hidden="true"
        className={`
          pointer-events-none absolute left-3 top-3 h-4 w-4
          border-l border-t border-transparent
          transition-all duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)]
          [@media(hover:hover)]:[@media(pointer:fine)]:group-hover:border-[var(--secondary-light)]/60
          group-focus-within:border-[var(--secondary-light)]/60
          ${
            active
              ? "border-l-[var(--secondary-light)]/60 border-t-[var(--secondary-light)]/60"
              : ""
          }
        `}
      />
      <span
        aria-hidden="true"
        className={`
          pointer-events-none absolute bottom-3 right-3 h-4 w-4
          border-b border-r border-transparent
          transition-all duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)]
          [@media(hover:hover)]:[@media(pointer:fine)]:group-hover:border-[var(--secondary-light)]/60
          group-focus-within:border-[var(--secondary-light)]/60
          ${
            active
              ? "border-b-[var(--secondary-light)]/60 border-r-[var(--secondary-light)]/60"
              : ""
          }
        `}
      />
    </>
  );
}

function IconBadge({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`
        flex size-[26px] shrink-0 items-center justify-center
        rounded-full
        border border-[var(--glass-border)]
        bg-white/[0.045]
        text-[var(--secondary-light)]
        transition-all duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)]
        [@media(hover:hover)]:[@media(pointer:fine)]:group-hover:border-[var(--secondary-light)]/50
        [@media(hover:hover)]:[@media(pointer:fine)]:group-hover:bg-[var(--secondary-light)]/10
        [@media(hover:hover)]:[@media(pointer:fine)]:group-hover:shadow-[0_0_14px_rgba(210,184,133,.32)]
        group-focus-within:border-[var(--secondary-light)]/50
        group-focus-within:bg-[var(--secondary-light)]/10
        group-focus-within:shadow-[0_0_14px_rgba(210,184,133,.32)]
        ${
          active
            ? "border-[var(--secondary-light)]/50 bg-[var(--secondary-light)]/10 shadow-[0_0_14px_rgba(210,184,133,.32)]"
            : ""
        }
      `}
    >
      {children}
    </span>
  );
}

/* =====================================================================
   Card
   ---------------------------------------------------------------------
   The reusable glass-card shell. Callers still supply their own
   background / border-color / radius / padding via `className` (About
   and Contact intentionally look different), and this handles the
   interactive-state classes plus optional corner accents / icon+label
   header. All standard div props (data-*, role, tabIndex, onClick,
   onKeyDown, onPointerDown, ref via forwardRef) pass straight through.
===================================================================== */

export interface CardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  active?: boolean;
  cornerAccents?: boolean;
  icon?: React.ReactNode;
  label?: React.ReactNode;
  children?: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  function Card(
    {
      active = false,
      cornerAccents = false,
      icon,
      label,
      className = "",
      children,
      ...rest
    },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={`group relative overflow-hidden ${hoverActiveClasses(
          active
        )} ${className}`}
        {...rest}
      >
        {cornerAccents && <CornerAccents active={active} />}

        {(icon || label) && (
          <div className="mb-2.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--secondary)]">
            {icon && <IconBadge active={active}>{icon}</IconBadge>}
            {label && (
              <span className="flex h-[26px] items-center leading-none">
                {label}
              </span>
            )}
          </div>
        )}

        {children}
      </div>
    );
  }
);