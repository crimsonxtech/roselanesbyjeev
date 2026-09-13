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
 *   <div
 *     data-reveal
 *     data-reveal-group="testimonials"
 *     data-reveal-stagger="300"
 *   >
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
    const motionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const revealAllImmediately = () => {
      document
        .querySelectorAll<HTMLElement>("[data-reveal]")
        .forEach((el) => el.classList.add("is-visible"));
    };

    /**
     * Reduced-motion state is handled dynamically so the hook behaves
     * correctly even if the user's OS/browser preference changes while
     * the page is open.
     */
    let observer: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let skeletonReadyObserver: MutationObserver | null = null;

    /**
     * Elements whose intersection fired while they were still sitting
     * behind PageSkeleton's `[data-skeleton-content]` overlay (opacity:0
     * but NOT display:none, so IntersectionObserver sees them as "in
     * view" regardless). Revealing them then would burn the animation
     * before anyone could see it, so we hold them here and reveal for
     * real once the skeleton finishes (see skeletonReadyObserver below).
     */
    const pendingWhileHidden = new Set<HTMLElement>();

    const isHiddenBySkeleton = (el: HTMLElement) =>
      !!el.closest("[data-skeleton-content]:not(.is-ready)");

    const revealElement = (el: HTMLElement) => {
      const delay = el.dataset.revealDelay;

      if (delay && !el.dataset.revealGroup) {
        el.style.setProperty("--reveal-delay", `${delay}ms`);
      }

      el.classList.add("is-visible");
    };

    const applyGroupStagger = (scope: ParentNode) => {
      const affectedGroups = new Set<string>();

      queryIncludingSelf(scope, "[data-reveal-group]").forEach((el) => {
        const group = el.dataset.revealGroup;

        if (group) {
          affectedGroups.add(group);
        }
      });

      affectedGroups.forEach((group) => {
        const selector = `[data-reveal-group="${CSS.escape(group)}"]`;

        const members = Array.from(
          document.querySelectorAll<HTMLElement>(selector)
        );

        members.forEach((el, index) => {
          const stagger = Number(el.dataset.revealStagger ?? 150);

          el.style.setProperty(
            "--reveal-delay",
            `${index * stagger}ms`
          );
        });
      });
    };

    const observeAll = (root: ParentNode) => {
      if (!observer || motionQuery.matches) return;

      applyGroupStagger(root);

      queryIncludingSelf(root, "[data-reveal]").forEach((el) => {
        if (!el.classList.contains("is-visible")) {
          observer?.observe(el);
        }
      });
    };

    const setupObservers = () => {
      if (motionQuery.matches) {
        revealAllImmediately();
        return;
      }

      observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            const el = entry.target as HTMLElement;

            // Still behind the loading skeleton: defer instead of
            // burning the reveal animation on an invisible element.
            if (isHiddenBySkeleton(el)) {
              pendingWhileHidden.add(el);
              return;
            }

            revealElement(el);
            obs.unobserve(el);
          });
        },
        {
          threshold: 0.12,
          rootMargin: "0px 0px -40px",
        }
      );

      observeAll(document);

      /**
       * Once PageSkeleton flips a `[data-skeleton-content]` wrapper to
       * `.is-ready`, replay the reveal for anything that got deferred
       * while it was hidden. IntersectionObserver itself won't refire
       * on its own here since the element's on-screen geometry hasn't
       * changed - only its ancestor's opacity/class has.
       */
      skeletonReadyObserver = new MutationObserver((mutations) => {
        const becameReady = mutations.some((mutation) => {
          const target = mutation.target as HTMLElement;
          return (
            target.hasAttribute("data-skeleton-content") &&
            target.classList.contains("is-ready")
          );
        });

        if (!becameReady || pendingWhileHidden.size === 0) return;

        pendingWhileHidden.forEach((el) => {
          revealElement(el);
          observer?.unobserve(el);
        });

        pendingWhileHidden.clear();
      });

      skeletonReadyObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ["class"],
        subtree: true,
      });

      /**
       * Watch for elements added after mount (tab switches, async content,
       * infinite scroll) — the original vanilla script missed these entirely.
       */
      mutationObserver = new MutationObserver((mutations) => {
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

      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    };

    /**
     * Initial setup.
     *
     * If reduced motion is already enabled, reveal everything immediately
     * and do not create unnecessary observers.
     */
    setupObservers();

    /**
     * If reduced-motion preference changes during the session:
     *
     * reduce motion ON  -> reveal everything immediately and stop observing.
     * reduce motion OFF -> recreate the observers so newly encountered
     *                      elements can use normal scroll reveal again.
     */
    const handleMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        mutationObserver?.disconnect();
        observer?.disconnect();
        skeletonReadyObserver?.disconnect();

        mutationObserver = null;
        observer = null;
        skeletonReadyObserver = null;
        pendingWhileHidden.clear();

        revealAllImmediately();

        return;
      }

      /**
       * Preference was relaxed.
       *
       * Existing elements intentionally remain visible. New elements,
       * dynamically inserted elements, or elements that were not previously
       * revealed can now use the normal IntersectionObserver flow.
       */
      setupObservers();
    };

    motionQuery.addEventListener("change", handleMotionChange);

    return () => {
      motionQuery.removeEventListener(
        "change",
        handleMotionChange
      );

      observer?.disconnect();
      mutationObserver?.disconnect();
      skeletonReadyObserver?.disconnect();

      observer = null;
      mutationObserver = null;
      skeletonReadyObserver = null;
      pendingWhileHidden.clear();
    };
  }, []);
}