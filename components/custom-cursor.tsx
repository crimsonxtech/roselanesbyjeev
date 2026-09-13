"use client";

import { useEffect, useRef, useState } from "react";

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  const [visible, setVisible] = useState(false);
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);
  const [enabled, setEnabled] = useState(false);

  // Track fine-pointer support, including dynamic changes
  useEffect(() => {
    const mql = window.matchMedia("(hover: hover) and (pointer: fine)");

    const update = () => setEnabled(mql.matches);

    update();
    mql.addEventListener("change", update);

    return () => {
      mql.removeEventListener("change", update);
    };
  }, []);

  // Disable the native cursor globally while custom cursor is enabled
  useEffect(() => {
    if (!enabled) return;

    document.documentElement.classList.add("custom-cursor");

    return () => {
      document.documentElement.classList.remove("custom-cursor");
    };
  }, [enabled]);

  // Track mouse position and button state
  useEffect(() => {
    if (!enabled) return;

    const cursor = cursorRef.current;
    const dot = dotRef.current;

    if (!cursor || !dot) return;

    let rafId: number | null = null;
    let lastX = 0;
    let lastY = 0;

    const applyPosition = () => {
      rafId = null;

      // Use viewport coordinates directly.
      // This avoids transform-based coordinate offsets.
      cursor.style.left = `${lastX}px`;
      cursor.style.top = `${lastY}px`;

      dot.style.left = `${lastX}px`;
      dot.style.top = `${lastY}px`;
    };

    const handleMouseMove = (event: MouseEvent) => {
      lastX = event.clientX;
      lastY = event.clientY;

      if (rafId === null) {
        rafId = requestAnimationFrame(applyPosition);
      }

      setVisible(true);
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    const handleMouseDown = () => {
      setActive(true);
    };

    const handleMouseUp = () => {
      setActive(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [enabled]);

  // Detect interactive elements
  useEffect(() => {
    if (!enabled) return;

    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      const isInteractive = !!target.closest(
        "a, button, [role='button'], [data-cursor-hover]"
      );

      setHover(isInteractive);
    };

    document.addEventListener("mouseover", handleMouseOver);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {/* Outer cursor */}
      <div
        ref={cursorRef}
        aria-hidden="true"
        className={[
          "pointer-events-none fixed left-0 top-0 z-[1000000]",
          "-translate-x-1/2 -translate-y-1/2",
          "rounded-full border-[2px]",
          "border-[var(--secondary)]",
          "transition-[width,height,opacity] duration-200 ease-out",
          "will-change-[left,top]",
          visible ? "opacity-100" : "opacity-0",
          hover ? "h-14 w-14" : "h-8 w-8",
        ].join(" ")}
      />

      {/* Inner dot */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className={[
          "pointer-events-none fixed left-0 top-0 z-[1000000]",
          "-translate-x-1/2 -translate-y-1/2",
          "h-2 w-2",
          "will-change-[left,top]",
          visible ? "opacity-100" : "opacity-0",
        ].join(" ")}
      >
        <div
          className={[
            "h-full w-full rounded-full",
            "bg-[var(--secondary)]",
            "transition-transform duration-150 ease-out",
            active ? "scale-[2.5]" : "scale-100",
          ].join(" ")}
        />
      </div>
    </>
  );
}