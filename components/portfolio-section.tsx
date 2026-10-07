"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Download, X } from "lucide-react";
import { ZoomableLightboxImage } from "@/components/zoomable-lightbox-image";
import {
  useBodyScrollLock,
  lockScrollbarReservation,
  unlockScrollbarReservation,
} from "@/hooks/use-body-scroll-lock";

export type PortfolioImage = {
  id: string;
  alt: string;
  width: number;
  height: number;
  thumbUrl: string;
  displayUrl: string;
  downloadUrl: string;
};

export function PortfolioSection({
  images: portfolioImages,
}: {
  images: PortfolioImage[];
}) {

    const [masonryColumns, setMasonryColumns] =
    React.useState(4);

  React.useEffect(() => {
    const updateColumns = () => {
      setMasonryColumns(
        window.innerWidth >= 640 ? 4 : 2,
      );
    };

    updateColumns();

    window.addEventListener(
      "resize",
      updateColumns,
    );

    return () => {
      window.removeEventListener(
        "resize",
        updateColumns,
      );
    };
  }, []);
  const [activeIndex, setActiveIndex] =
    React.useState<number | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [erroredIds, setErroredIds] =
    React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    setMounted(true);
  }, []);

  /*
   * Tracks whether the currently open lightbox owns
   * a temporary browser history entry.
   *
   * This is what allows native browser/device Back
   * to close the lightbox instead of leaving the page.
   */
  const lightboxHistoryRef = React.useRef(false);

  /*
   * Prevents duplicate history operations when closing
   * through X / ESC while the browser is already processing
   * a popstate event.
   */
  const closingFromHistoryRef = React.useRef(false);

  const closeButtonRef =
    React.useRef<HTMLButtonElement>(null);
  const thumbnailRefs = React.useRef(new Map<number, HTMLImageElement>());
  const lightboxImageHostRef = React.useRef<HTMLDivElement>(null);
  const animationInProgressRef = React.useRef(false);
  const [isOpening, setIsOpening] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const [backdropVisible, setBackdropVisible] = React.useState(false);

  const activeImage =
    activeIndex !== null
      ? portfolioImages[activeIndex]
      : null;

  const markErrored = React.useCallback((id: string) => {
    setErroredIds((current) => ({ ...current, [id]: true }));
  }, []);

  const animateImageBetweenRects = React.useCallback(
    (
      source: HTMLImageElement,
      from: DOMRect,
      to: DOMRect,
      options: {
        borderRadiusFrom?: string;
        borderRadiusTo?: string;
        /*
         * When provided, a second clone loading this (higher quality) src is
         * flown alongside the base clone and cross-faded in the moment it
         * finishes loading — whether that happens mid-flight or slightly
         * after landing. This removes the old "blurry thumb -> sharp image"
         * snap: the swap is always a fade, never a hard cut.
         */
        crossfadeSrc?: string;
        onArrive?: () => void;
      },
      onFinish: () => void,
    ) => {
      const {
        borderRadiusFrom = "0px",
        borderRadiusTo = "0px",
        crossfadeSrc,
        onArrive,
      } = options;

      const scaleX = to.width / from.width;
      const scaleY = to.height / from.height;
      const objectFit = getComputedStyle(source).objectFit || "contain";

      const makeClone = (src: string) => {
        const el = document.createElement("img");
        el.src = src;
        el.alt = "";
        el.setAttribute("aria-hidden", "true");
        Object.assign(el.style, {
          position: "fixed",
          top: `${from.top}px`,
          left: `${from.left}px`,
          width: `${from.width}px`,
          height: `${from.height}px`,
          margin: "0",
          objectFit,
          pointerEvents: "none",
          transformOrigin: "top left",
          willChange: "transform, opacity, border-radius",
          zIndex: "1000002",
        });
        document.body.appendChild(el);
        return el;
      };

      const baseSrc = source.currentSrc || source.src;
      const baseClone = makeClone(baseSrc);

      const needsCrossfade = Boolean(crossfadeSrc && crossfadeSrc !== baseSrc);
      const hiResClone = needsCrossfade ? makeClone(crossfadeSrc!) : null;
      if (hiResClone) hiResClone.style.opacity = "0";

      const keyframes: Keyframe[] = [
        {
          transform: "translate3d(0, 0, 0) scale(1, 1)",
          borderRadius: borderRadiusFrom,
        },
        {
          transform: `translate3d(${to.left - from.left}px, ${
            to.top - from.top
          }px, 0) scale(${scaleX}, ${scaleY})`,
          borderRadius: borderRadiusTo,
        },
      ];
      const timing: KeyframeAnimationOptions = {
        duration: 380,
        easing: "cubic-bezier(.22, 1, .36, 1)",
        fill: "forwards",
      };

      const flightAnimations = [baseClone.animate(keyframes, timing)];
      if (hiResClone) flightAnimations.push(hiResClone.animate(keyframes, timing));

      // Resolves once the hi-res clone has actually painted a frame (or
      // immediately if there's nothing to cross-fade), capped so a slow /
      // failed load can never stall the sequence indefinitely.
      const hiResReady = new Promise<void>((resolve) => {
        if (!hiResClone) {
          resolve();
          return;
        }
        const reveal = () => {
          hiResClone.style.transition = "opacity 200ms ease-out";
          hiResClone.style.opacity = "1";
          window.setTimeout(resolve, 200);
        };
        if (hiResClone.complete && hiResClone.naturalWidth > 0) {
          requestAnimationFrame(reveal);
        } else {
          hiResClone.addEventListener("load", reveal, { once: true });
          hiResClone.addEventListener("error", () => resolve(), { once: true });
          window.setTimeout(resolve, 900);
        }
      });

      Promise.allSettled([
        ...flightAnimations.map((animation) => animation.finished),
        hiResReady,
      ]).finally(() => {
        onArrive?.();

        const fadeOutTargets = hiResClone ? [hiResClone, baseClone] : [baseClone];
        const fadeOuts = fadeOutTargets.map((el) =>
          el.animate([{ opacity: 1 }, { opacity: 0 }], {
            duration: 180,
            easing: "ease-out",
            fill: "forwards",
          }).finished,
        );

        Promise.allSettled(fadeOuts).finally(() => {
          baseClone.remove();
          hiResClone?.remove();
          onFinish();
        });
      });
    },
    [],
  );

  /*
   * The ONLY formula for "how big does the lightbox image render."
   *
   * Must stay numerically identical to the lightbox host div's padding
   * (px-8 py-12 sm:px-14 sm:py-14 below) since that padding is the sole
   * constraint on the image's box — the image itself uses max-w-full /
   * max-h-full, not its own viewport-relative max-w/h. Two independent
   * formulas for the same box is exactly what caused the old
   * misalignment/flicker: this animation's target rect and the real
   * rendered box could silently drift apart whenever one was tweaked
   * without the other.
   */
  /*
   * The ONLY formula for "how big does the lightbox image render."
   *
   * Must stay numerically identical to the lightbox dialog's own padding
   * (p-4 sm:p-6 lg:p-10 below) — that padding is the SOLE constraint on
   * the image's box. The inner host div intentionally carries no padding
   * of its own; a second padding source there is what caused the earlier
   * bug where the flown clone landed at a different size than the real
   * image (this formula only knew about one of the two paddings).
   */
  const getLightboxTargetRect = React.useCallback((source: DOMRect) => {
    /*
     * document.documentElement.clientWidth/clientHeight, NOT
     * window.innerWidth/innerHeight. innerWidth includes the width of the
     * permanent vertical scrollbar (html { overflow-y: scroll } in
     * globals.css); the fixed-position dialog does not extend underneath
     * that scrollbar, so centering against innerWidth silently assumes a
     * wider box than what's actually on screen and drifts the "center"
     * to the right by ~half the scrollbar's width. clientWidth already
     * excludes it, matching both the dialog's real box and the coordinate
     * system getBoundingClientRect() (used for the thumbnail) reports in.
     */
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const padding =
      viewportWidth >= 1024 ? 80 : viewportWidth >= 640 ? 48 : 32;
    const scale = Math.min(
      (viewportWidth - padding) / source.width,
      (viewportHeight - padding) / source.height,
    );
    const width = source.width * scale;
    const height = source.height * scale;

    return new DOMRect(
      (viewportWidth - width) / 2,
      (viewportHeight - height) / 2,
      width,
      height,
    );
  }, []);

  /*
   * Open lightbox.
   *
   * A temporary history entry is added so that the native
   * browser/device Back action can close the lightbox.
   */
  const openImage = React.useCallback((index: number) => {
    if (
      index < 0 ||
      index >= portfolioImages.length ||
      animationInProgressRef.current
    ) {
      return;
    }

    /*
     * Synchronous and eager, ahead of useBodyScrollLock's own effect
     * (which won't fire until after this render commits and paints).
     * getLightboxTargetRect below reads the viewport width, and that
     * width changes the instant the scrollbar is hidden, so the hiding
     * has to happen before that read, not after. See
     * lockScrollbarReservation's doc comment.
     */
    lockScrollbarReservation();

    const thumbnail = thumbnailRefs.current.get(index);
    const targetImage = portfolioImages[index];

    const showLightboxBackdrop = () => {
      setIsOpening(true);
      setActiveIndex(index);

      window.history.pushState(
        {
          ...window.history.state,
          portfolioLightbox: true,
        },
        "",
        window.location.href,
      );

      lightboxHistoryRef.current = true;
      closingFromHistoryRef.current = false;

      // Fade the backdrop in on the next frame rather than snapping to full
      // opacity, so it darkens gently while the image is in flight.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setBackdropVisible(true));
      });
    };

    if (!thumbnail) {
      showLightboxBackdrop();
      setIsOpening(false);
      return;
    }

    animationInProgressRef.current = true;
    const previousOpacity = thumbnail.style.opacity;
    const sourceRect = thumbnail.getBoundingClientRect();
    const sourceBorderRadius = getComputedStyle(thumbnail).borderRadius;
    thumbnail.style.opacity = "0";
    showLightboxBackdrop();

    /*
     * The target rect is computed analytically (viewport size + the
     * lightbox host's fixed padding), not by measuring the live lightbox
     * <img>. Measuring it was racy — it depends on React having committed
     * the just-triggered state update AND the image having finished
     * whatever layout pass determines its box — and any drift between that
     * measurement and this formula (or between this formula and the real
     * CSS) reads as a mid-flight jump / flicker on arrival. See the
     * comment above getLightboxTargetRect: this formula IS the box, so
     * there is nothing to race against and no fallback needed.
     */
    animateImageBetweenRects(
      thumbnail,
      sourceRect,
      getLightboxTargetRect(sourceRect),
      {
        borderRadiusFrom: sourceBorderRadius,
        borderRadiusTo: "0px",
        crossfadeSrc: targetImage
          ? targetImage.displayUrl
          : undefined,
        onArrive: () => setIsOpening(false),
      },
      () => {
        thumbnail.style.opacity = previousOpacity;
        animationInProgressRef.current = false;
      },
    );
  }, [animateImageBetweenRects, getLightboxTargetRect, portfolioImages]);

  const finishClose = React.useCallback(() => {
    animationInProgressRef.current = false;
    setIsClosing(false);
    setActiveIndex(null);
    // Balances the eager lockScrollbarReservation() call in openImage.
    unlockScrollbarReservation();
  }, []);

  const beginCloseAnimation = React.useCallback(() => {
    if (activeIndex === null || animationInProgressRef.current) {
      return;
    }

    const image = lightboxImageHostRef.current?.querySelector("img");
    const thumbnail = thumbnailRefs.current.get(activeIndex);

    if (!image || !thumbnail) {
      finishClose();
      return;
    }

    animationInProgressRef.current = true;
    setIsClosing(true);
    setBackdropVisible(false);

    const previousOpacity = thumbnail.style.opacity;
    const targetBorderRadius = getComputedStyle(thumbnail).borderRadius;
    thumbnail.style.opacity = "0";

    animateImageBetweenRects(
      image,
      image.getBoundingClientRect(),
      thumbnail.getBoundingClientRect(),
      {
        borderRadiusFrom: "0px",
        borderRadiusTo: targetBorderRadius,
      },
      () => {
        thumbnail.style.opacity = previousOpacity;
        finishClose();
      },
    );
  }, [activeIndex, animateImageBetweenRects, finishClose]);

  /*
   * Close lightbox.
   *
   * If the lightbox created a history entry, go back one
   * step so the URL/history stack returns to its original state.
   *
   * popstate then performs the actual lightbox state cleanup.
   */
  const closeImage = React.useCallback(() => {
    if (activeIndex === null) {
      return;
    }

    if (lightboxHistoryRef.current) {
      closingFromHistoryRef.current = true;
      lightboxHistoryRef.current = false;
      window.history.back();
      return;
    }

    beginCloseAnimation();
  }, [activeIndex, beginCloseAnimation]);

  /*
   * Native browser/device Back.
   *
   * When the user presses:
   * - browser Back
   * - Android system Back
   * - browser navigation Back
   * - iOS browser back navigation
   *
   * the temporary history entry is popped and this closes
   * the lightbox without navigating away from the page.
   */
  React.useEffect(() => {
    const handlePopState = () => {
      lightboxHistoryRef.current = false;
      closingFromHistoryRef.current = false;
      beginCloseAnimation();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [beginCloseAnimation]);

  /*
   * Lock page scrolling while the lightbox is open.
   *
   * Uses a position:fixed-based lock rather than plain
   * `overflow: hidden`, since iOS Safari still allows the page to be
   * dragged/rubber-banded (and briefly reveals it during the
   * address-bar show/hide animation) with overflow alone.
   */
  useBodyScrollLock(activeIndex !== null);

  /*
   * Keyboard controls:
   *
   * ESC        -> close
   * ArrowLeft  -> previous image
   * ArrowRight -> next image
   */
  React.useEffect(() => {
    if (activeIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeImage();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();

        setActiveIndex((current) => {
          if (current === null) return null;

          return current === 0
            ? portfolioImages.length - 1
            : current - 1;
        });

        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();

        setActiveIndex((current) => {
          if (current === null) return null;

          return current === portfolioImages.length - 1
            ? 0
            : current + 1;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, closeImage, portfolioImages.length]);

  /*
   * Keep focus on the close button when the lightbox opens.
   */
  React.useEffect(() => {
    if (activeIndex === null) return;

    const frameId = requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [activeIndex]);

  /*
   * Previous image.
   */
  const showPrevious = React.useCallback(() => {
    setActiveIndex((current) => {
      if (current === null) return null;

      return current === 0
        ? portfolioImages.length - 1
        : current - 1;
    });
  }, [portfolioImages.length]);

  /*
   * Next image.
   */
  const showNext = React.useCallback(() => {
    setActiveIndex((current) => {
      if (current === null) return null;

      return current === portfolioImages.length - 1
        ? 0
        : current + 1;
    });
  }, [portfolioImages.length]);

  return (
    <>
      <section
        id="portfolio"
        aria-labelledby="portfolio-heading"
        className="
          relative
          w-full
          overflow-visible
          px-5
          pt-[calc(var(--header-offset,0px)+var(--header-height,100px)+var(--section-header-gap,0px))]
          pb-[clamp(52px,6vw,88px)]
          sm:px-6
          lg:px-8
        "
      >
        <div
          className="
            mx-auto
            w-full
            max-w-[1240px]
          "
        >
          {/* HEADER */}
          <div
            className="
              mb-[clamp(24px,3vw,36px)]
              flex
              items-end
              justify-between
              gap-6
            "
          >
            <div
              className="min-w-0"
              data-reveal
            >
<h2
  id="portfolio-heading"
  className="min-w-0 max-w-full font-display text-[clamp(2.1rem,8vw,3.3rem)] font-medium leading-[1.05] tracking-[-0.02em] text-[var(--cream)]"
>
  <span className="italic whitespace-nowrap">
    A collection of
  </span>{" "}
  <span className="font-brand inline whitespace-nowrap text-[clamp(2.5rem,10vw,4.3rem)] leading-none text-[var(--secondary-light)]">
    Beautiful Moments
  </span>
</h2>
            </div>
          </div>

{/* TRUE MASONRY — ROW-WISE ORDER */}
<div
  aria-label="Wedding photography portfolio"
  className="
    flex
    w-full
    gap-[10px]
  "
>
  {Array.from({
    length: masonryColumns,
  }).map((_, columnIndex) => {
    const columnImages = portfolioImages.filter(
      (_, index) =>
        index % masonryColumns === columnIndex,
    );

    return (
      <div
        key={columnIndex}
        className="
          min-w-0
          flex-1
          space-y-[10px]
        "
      >
        {columnImages.map((image) => {
          const index = portfolioImages.findIndex(
            (item) => item.id === image.id,
          );

          const isErrored = Boolean(
            erroredIds[image.id],
          );

          return (
            <div
              key={image.id}
              className="w-full"
            >
              <button
                type="button"
                aria-label={`Open portfolio image ${
                  index + 1
                } of ${
                  portfolioImages.length
                }: ${image.alt}`}
                onClick={() =>
                  openImage(index)
                }
                className="
                  group
                  relative
                  block
                  w-full
                  overflow-hidden
                  rounded-[16px]
                  [clip-path:inset(0_round_16px)]
                  border
                  border-transparent
                  bg-[rgba(var(--primary-darkest-rgb),.35)]
                  p-0
                  text-left
                  shadow-[0_1px_2px_rgba(0,0,0,0.08)]

                  transition-[box-shadow,border-color]
                  duration-500
                  ease-[cubic-bezier(.22,1,.36,1)]

                  hover:border-[var(--secondary-light)]
                  hover:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)]

                  focus:outline-none
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[var(--secondary-light)]
                  focus-visible:ring-offset-2
                  focus-visible:ring-offset-[var(--primary-darkest)]
                "
              >
                {!isErrored ? (
                  <img
                    src={image.thumbUrl}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                    loading={
                      index < 4
                        ? "eager"
                        : "lazy"
                    }
                    decoding="async"
                    draggable={false}
                    onError={() =>
                      markErrored(image.id)
                    }
                    ref={(element) => {
                      if (element) {
                        thumbnailRefs.current.set(
                          index,
                          element,
                        );
                      } else {
                        thumbnailRefs.current.delete(
                          index,
                        );
                      }
                    }}
                    className="
                      block
                      h-auto
                      w-full
                      object-contain
                      transform-gpu

                      transition-transform
                      duration-500
                      ease-[cubic-bezier(.22,1,.36,1)]

                      group-hover:scale-[1.045]

                      motion-reduce:transition-none
                      motion-reduce:group-hover:scale-100
                    "
                  />
                ) : (
                  <div
                    className="
                      flex
                      aspect-[2/3]
                      w-full
                      items-center
                      justify-center
                      bg-[rgba(var(--primary-darkest-rgb),.5)]
                      text-center
                      text-xs
                      tracking-wide
                      text-[var(--secondary-light)]/70
                    "
                  >
                    Image unavailable
                  </div>
                )}

                {/* elegant hover overlay */}
                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    inset-0
                    flex
                    items-end
                    bg-gradient-to-t
                    from-[rgba(var(--primary-darkest-rgb),.72)]
                    via-transparent
                    to-transparent
                    opacity-0

                    transition-opacity
                    duration-400
                    ease-[cubic-bezier(.22,1,.36,1)]

                    group-hover:opacity-100
                    group-focus-visible:opacity-100
                  "
                >
                  <span
                    className="
                      m-4
                      font-serif
                      text-[13px]
                      italic
                      tracking-wide
                      text-[var(--cream)]

                      translate-y-2
                      transition-transform
                      duration-400
                      ease-[cubic-bezier(.22,1,.36,1)]

                      group-hover:translate-y-0
                    "
                  >
                    {image.alt}
                  </span>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    );
  })}
</div>
        </div>
      </section>

      {/* FULL-SCREEN LIGHTBOX */}
      {mounted &&
        activeIndex !== null &&
        activeImage &&
        createPortal(
          <div
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          className="
            fixed
            inset-0
            z-[999999]
            flex
            items-center
            justify-center
            bg-black/95
            p-4
            backdrop-blur-sm
            sm:p-6
            lg:p-10
            transition-opacity
            duration-[380ms]
          "
          style={{
            overscrollBehavior: "none",
            opacity: isClosing || !backdropVisible ? 0 : 1,
            pointerEvents: isClosing ? "none" : "auto",
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeImage();
            }
          }}
        >
          {/* SINGLE CLOSE CONTROL */}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeImage}
            aria-label="Close image viewer"
            className="
              absolute
              right-4
              top-4
              z-50
              flex
              size-11
              items-center
              justify-center
              rounded-full
              border
              border-white/15
              bg-black/50
              text-white
              backdrop-blur-md
              transition
              hover:bg-white/10
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-white/80
              sm:right-6
              sm:top-6
            "
          >
            <X className="size-5" />
          </button>

          {/* DOWNLOAD ORIGINAL */}
          <a
            href={activeImage.downloadUrl}
            download
            aria-label="Download original image"
            title="Download original"
            className="
              absolute
              right-[68px]
              top-4
              z-50
              flex
              size-11
              items-center
              justify-center
              rounded-full
              border
              border-white/15
              bg-black/50
              text-white
              backdrop-blur-md
              transition
              hover:bg-white/10
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-white/80
              sm:right-[76px]
              sm:top-6
            "
          >
            <Download className="size-5" />
          </a>

          {/* PREVIOUS */}
          <button
            type="button"
            onClick={showPrevious}
            aria-label="Previous image"
            className="
              absolute
              left-3
              top-1/2
              z-40
              flex
              size-10
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              border
              border-white/10
              bg-black/35
              text-2xl
              text-white
              backdrop-blur-md
              transition
              hover:bg-white/10
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-white/80
              sm:left-6
              sm:size-11
            "
          >
            ‹
          </button>

          {/* NEXT */}
          <button
            type="button"
            onClick={showNext}
            aria-label="Next image"
            className="
              absolute
              right-3
              top-1/2
              z-40
              flex
              size-10
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              border
              border-white/10
              bg-black/35
              text-2xl
              text-white
              backdrop-blur-md
              transition
              hover:bg-white/10
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-white/80
              sm:right-6
              sm:size-11
            "
          >
            ›
          </button>

          {/* IMAGE */}
          <div
            ref={lightboxImageHostRef}
            className="
              relative
              flex
              h-full
              w-full
              items-center
              justify-center
              overflow-hidden
            "
          >
            <ZoomableLightboxImage
              key={activeImage.id}
              src={activeImage.displayUrl}
              alt={activeImage.alt}
              width={activeImage.width}
              height={activeImage.height}
              onSwipePrev={showPrevious}
              onSwipeNext={showNext}
              priority
              sizes="100vw"
              style={{ opacity: isOpening || isClosing ? 0 : 1 }}
              className="
                max-h-full
                max-w-full
                w-auto
                object-contain
                transition-opacity
                duration-[240ms]
                shadow-[0_24px_80px_rgba(0,0,0,.45)]
              "
            />
          </div>

          {/* IMAGE COUNTER */}
          <div
            aria-live="polite"
            className="
              pointer-events-none
              absolute
              bottom-5
              left-1/2
              -translate-x-1/2
              rounded-full
              border
              border-white/10
              bg-black/45
              px-3
              py-1.5
              text-xs
              tracking-[.12em]
              text-white/75
              backdrop-blur-md
            "
          >
            {activeIndex + 1} / {portfolioImages.length}
          </div>
          </div>,
          document.body,
        )}
    </>
  );
}