"use client";

import { useEffect } from "react";

/**
 * Scroll-reveal hook. Mount this ONCE, high in your tree (e.g. root layout
 * or a top-level <Providers> component). It observes every element in the
 * DOM with a `data-reveal` attribute and adds `.is-visible` when it scrolls
 * into view, matching the CSS in styles.css.
 *
 * Usage on any element, anywhere in your app:
 *   <div data-reveal>...</div>
 *   <div data-reveal data-reveal-delay="150">...</div>
 *
 * Group stagger (replaces the old hardcoded nth-child CSS — works for
 * ANY number of items, not just 6, including items added later or in
 * batches):
 *   <div data-reveal data-reveal-group="testimonials" data-reveal-stagger="300">
 */

/**
 * `querySelectorAll` only searches descendants, never `root` itself.
 * When a mutation's added node *is* the matching element (rather than a
 * wrapper containing it), a plain `root.querySelectorAll(selector)` call
 * would silently skip it. This includes `root` in the results when it
 * matches too.
 */
function queryIncludingSelf(
  root: ParentNode,
  selector: string
): HTMLElement[] {
  const results: HTMLElement[] = [];

  if (root instanceof HTMLElement && root.matches(selector)) {
    results.push(root);
  }

  root.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    results.push(el);
  });

  return results;
}

export function useScrollReveal() {
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const revealAllImmediately = () => {
      document
        .querySelectorAll<HTMLElement>("[data-reveal]")
        .forEach((el) => el.classList.add("is-visible"));
    };

    if (!("IntersectionObserver" in window)) {
      revealAllImmediately();
      return;
    }

    if (motionQuery.matches) {
      revealAllImmediately();
      // Still bail out of setting up observers below — nothing left to
      // observe once everything is already revealed. The `change`
      // listener further down covers the case where motion preference
      // is later relaxed/tightened without a full remount.
    }

    // Assign group-relative stagger delays dynamically. Recomputed over
    // the WHOLE document (not just the newly-added subtree) every time a
    // grouped element appears, so a batch of siblings added in a single
    // commit (e.g. a list re-render) still gets a correct sequential
    // stagger instead of every new item landing on index 0.
    const applyGroupStagger = (scope: ParentNode) => {
      const affectedGroups = new Set<string>();

      queryIncludingSelf(scope, "[data-reveal-group]").forEach((el) => {
        affectedGroups.add(el.dataset.revealGroup!);
      });

      affectedGroups.forEach((group) => {
        const selector = `[data-reveal-group="${CSS.escape(group)}"]`;
        const members = Array.from(
          document.querySelectorAll<HTMLElement>(selector)
        );

        members.forEach((el, index) => {
          const stagger = Number(el.dataset.revealStagger ?? 150);
          el.style.setProperty("--reveal-delay", `${index * stagger}ms`);
        });
      });
    };

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const el = entry.target as HTMLElement;

          // Per-element delay (only applies if not already set by group stagger)
          const delay = el.dataset.revealDelay;
          if (delay && !el.dataset.revealGroup) {
            el.style.setProperty("--reveal-delay", `${delay}ms`);
          }

          el.classList.add("is-visible");
          obs.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px" }
    );

    const observeAll = (root: ParentNode) => {
      applyGroupStagger(root);
      queryIncludingSelf(root, "[data-reveal]").forEach((el) => {
        observer.observe(el);
      });
    };

    observeAll(document);

    // Watch for elements added after mount (tab switches, async content,
    // infinite scroll) — the original vanilla script missed these entirely.
    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (
            node.hasAttribute("data-reveal") ||
            node.querySelector("[data-reveal]")
          ) {
            observeAll(node);
          }
        });
      }
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    // If the user's reduced-motion preference changes mid-session, react
    // to it instead of only reading it once at mount.
    const handleMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        mutationObserver.disconnect();
        observer.disconnect();
        revealAllImmediately();
      }
      // Relaxing the preference mid-session doesn't need to do anything:
      // anything already revealed stays revealed either way, and nothing
      // is hidden again to re-animate.
    };

    motionQuery.addEventListener("change", handleMotionChange);

    return () => {
      motionQuery.removeEventListener("change", handleMotionChange);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);
}