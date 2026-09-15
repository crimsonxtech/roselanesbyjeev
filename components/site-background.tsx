"use client";

import { useEffect, useRef } from "react";

const STAR_COUNT = 30;

export function SiteBackground() {
  const fieldRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const field = fieldRef.current;

    if (!field) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < STAR_COUNT; i += 1) {
      const star = document.createElement("div");

      star.style.position = "absolute";
      star.style.borderRadius = "50%";
      star.style.background = "var(--secondary-light)";
      star.style.boxShadow =
        "0 0 6px 1px rgba(238, 221, 184, 0.75)";
      star.style.opacity = prefersReducedMotion ? "0.35" : "0";

      const size = Math.random() * 2 + 1;

      star.style.width = `${size.toFixed(1)}px`;
      star.style.height = `${size.toFixed(1)}px`;
      star.style.top = `${(Math.random() * 100).toFixed(2)}%`;
      star.style.left = `${(Math.random() * 100).toFixed(2)}%`;

      if (!prefersReducedMotion) {
        const duration = (Math.random() * 4 + 2.5).toFixed(2);
        const delay = (Math.random() * 6).toFixed(2);
        const peak = (Math.random() * 0.5 + 0.45).toFixed(2);

        star.animate(
          [
            {
              opacity: 0,
              transform: "scale(.5)",
            },
            {
              opacity: Number(peak),
              transform: "scale(1)",
            },
            {
              opacity: 0,
              transform: "scale(.5)",
            },
          ],
          {
            duration: Number(duration) * 1000,
            delay: Number(delay) * 1000,
            iterations: Infinity,
            easing: "ease-in-out",
            fill: "both",
          },
        );
      }

      fragment.appendChild(star);
    }

    field.replaceChildren(fragment);

    return () => {
      field.replaceChildren();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="site-background pointer-events-none"
      style={{
        zIndex: 0,
      }}
    >
      {/* Star field */}
      <div
        ref={fieldRef}
        className="absolute inset-0 h-full w-full overflow-hidden"
      />
    </div>
  );
}
