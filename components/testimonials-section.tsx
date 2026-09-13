"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"

type Testimonial = {
  image: string
  alt: string
  quote: string
  name: string 
  rating: number
}

const testimonials: Testimonial[] = [
  {
    image:
      "https://images.roselanesbyjeev.in/roselanesbyjeev/portfolio/testimonials/44c2f01d-a233-4025-b9a5-d70e96bbf1e2.webp",
    alt: "Aisha and Rohan",
    quote:
      "Jeevan captured our wedding like he'd known us for years. Every candid moment felt effortless, and the final gallery still gives us goosebumps.",
    name: "Aisha & Rohan", 
    rating: 5,
  },
  {
    image:
      "https://images.roselanesbyjeev.in/roselanesbyjeev/portfolio/testimonials/d903e39f-3d67-4ef2-8054-99ab0d905c92.webp",
    alt: "Meera and Karan",
    quote:
      "We didn't even notice him shooting half the time — that's how natural everything felt. The pre-wedding shoot alone made us cry happy tears.",
    name: "Meera & Karan", 
    rating: 4,
  },
  {
    image:
      "https://images.roselanesbyjeev.in/roselanesbyjeev/portfolio/testimonials/54a31885-fdd9-4f5b-9b2e-9569c9767b07.webp",
    alt: "Sana and Dev",
    quote:
      "Professional, warm, and endlessly patient with our chaotic families. The photos turned out more beautiful than we imagined possible.",
    name: "Sana & Dev", 
    rating: 4,
  },
  {
    image:
      "https://images.roselanesbyjeev.in/roselanesbyjeev/portfolio/testimonials/0e6912e2-e21a-4951-8bc0-9acd6654ec42.webp",
    alt: "Priya and Arjun",
    quote:
      "Booking him was the easiest decision of our entire wedding planning. Fast turnaround, stunning edits, and such a calming presence on the day.",
    name: "Priya & Arjun", 
    rating: 5,
  },
  {
    image:
      "https://images.roselanesbyjeev.in/roselanesbyjeev/portfolio/testimonials/3ce71027-b7df-465a-8de5-703c22e7da50.webp",
    alt: "Neha and Vikram",
    quote:
      "He has an eye for the tiny, fleeting moments — the ones you'd never think to ask for but end up loving the most.",
    name: "Neha & Vikram", 
    rating: 5,
  },
  {
    image:
      "https://images.roselanesbyjeev.in/roselanesbyjeev/portfolio/testimonials/16fc9c11-32ce-4cb2-b86e-8393cfc4f26b.webp",
    alt: "Ritu and Sameer",
    quote:
      "From the first call to the final delivery, everything felt thoughtful. Worth every rupee for the memories we'll keep forever.",
    name: "Ritu & Sameer", 
    rating: 5,
  },
]

export function TestimonialsSection() {
  const trackRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLElement | null)[]>([])

  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const scrollbarRef = useRef<HTMLDivElement>(null)
  const [scrollbarThumbWidth, setScrollbarThumbWidth] = useState(100)
  const [scrollbarThumbPosition, setScrollbarThumbPosition] = useState(0)
  const scrollbarDragRef = useRef(false)
  const scrollbarDragStartXRef = useRef(0)
  const scrollbarDragStartPositionRef = useRef(0)
  const scrollbarDragOffsetRef = useRef(0)

  const dragRafRef = useRef<number | null>(null)
  const pendingScrollRef = useRef<number | null>(null)

  const pointerDownRef = useRef(false)
  const draggingRef = useRef(false)
  const pointerIdRef = useRef<number | null>(null)

  const startXRef = useRef(0)
  const startYRef = useRef(0)
  const startScrollRef = useRef(0)

  const pressedCardRef = useRef<number | null>(null)

  const prefersReducedMotion = useCallback(() => {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  }, [])

  const clearActiveCard = useCallback(() => {
    setActiveIndex(null)
  }, [])

  const activateCard = useCallback((index: number) => {
    setActiveIndex(index)
  }, [])

  /*
   * ========================================
   * POINTER DOWN
   * ========================================
   *
   * Mouse:
   * - enables drag scrolling
   * - remembers pressed card for click activation
   *
   * Touch:
   * - native browser horizontal scrolling remains active
   */
  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (
      event.button !== 0 ||
      !event.isPrimary ||
      event.pointerType === "touch"
    ) {
      return
    }

    const track = trackRef.current

    if (!track) {
      return
    }

    const target = event.target as HTMLElement

    const card = target.closest<HTMLElement>(
      "[data-testimonial-card]",
    )

    pointerDownRef.current = true
    draggingRef.current = false

    pointerIdRef.current = event.pointerId

    startXRef.current = event.clientX
    startYRef.current = event.clientY

    startScrollRef.current = track.scrollLeft

    pressedCardRef.current = card
      ? Number(card.dataset.testimonialIndex)
      : null
  }

  /*
   * ========================================
   * POINTER MOVE
   * ========================================
   */
  const handlePointerMove = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (
      !pointerDownRef.current ||
      !event.isPrimary
    ) {
      return
    }

    const track = trackRef.current

    if (!track) {
      return
    }

    const distanceX =
      event.clientX - startXRef.current

    const distanceY =
      event.clientY - startYRef.current

    const absX = Math.abs(distanceX)
    const absY = Math.abs(distanceY)

    if (!draggingRef.current) {
      if (absX < 6 && absY < 6) {
        return
      }

      // Keep vertical gestures available for normal page scrolling.
      if (absY > absX) {
        pointerDownRef.current = false
        draggingRef.current = false
        pressedCardRef.current = null
        return
      }

      // Horizontal gesture has started.
      draggingRef.current = true
      setIsDragging(true)

      // Physical dragging must never be smooth-scrolled.
      track.style.scrollBehavior = "auto"

      if (pointerIdRef.current !== null) {
        try {
          event.currentTarget.setPointerCapture(
            pointerIdRef.current,
          )
        } catch {
          // Ignore pointer-capture errors.
        }
      }
    }

    if (!draggingRef.current) {
      return
    }

    event.preventDefault()

    const nextScroll =
      startScrollRef.current - distanceX

    pendingScrollRef.current = nextScroll

    /*
     * Limit DOM writes to one per animation frame.
     * This keeps the card movement locked to the pointer
     * without flooding the browser with scroll updates.
     */
    if (dragRafRef.current === null) {
      dragRafRef.current = requestAnimationFrame(() => {
        if (
          trackRef.current &&
          pendingScrollRef.current !== null
        ) {
          trackRef.current.scrollLeft =
            pendingScrollRef.current
        }

        dragRafRef.current = null
      })
    }
  }

  const cleanupCarouselDrag = () => {
    if (dragRafRef.current !== null) {
      cancelAnimationFrame(dragRafRef.current)
      dragRafRef.current = null
    }

    pendingScrollRef.current = null

    if (trackRef.current) {
      trackRef.current.style.scrollBehavior = ""
    }
  }

  /*
   * ========================================
   * POINTER UP
   * ========================================
   */
  const handlePointerUp = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (
      !pointerDownRef.current &&
      !draggingRef.current
    ) {
      return
    }

    const wasDragging = draggingRef.current
    const pressedCard = pressedCardRef.current

    pointerDownRef.current = false
    draggingRef.current = false
    pointerIdRef.current = null
    pressedCardRef.current = null

    cleanupCarouselDrag()

    setIsDragging(false)

    /*
     * A click/tap activates the card.
     * A drag does not.
     */
    if (
      !wasDragging &&
      pressedCard !== null
    ) {
      activateCard(pressedCard)
    }

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId,
      )
    ) {
      try {
        event.currentTarget.releasePointerCapture(
          event.pointerId,
        )
      } catch {
        // Ignore pointer-capture cleanup errors.
      }
    }
  }

  /*
   * ========================================
   * POINTER CANCEL
   * ========================================
   */
  const handlePointerCancel = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    pointerDownRef.current = false
    draggingRef.current = false
    pointerIdRef.current = null
    pressedCardRef.current = null

    cleanupCarouselDrag()

    setIsDragging(false)

    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId,
      )
    ) {
      try {
        event.currentTarget.releasePointerCapture(
          event.pointerId,
        )
      } catch {
        // Ignore pointer-capture cleanup errors.
      }
    }
  }

  /*
   * ========================================
   * LOST POINTER CAPTURE
   * ========================================
   */
  const handleLostPointerCapture = () => {
    pointerDownRef.current = false
    draggingRef.current = false
    pointerIdRef.current = null
    pressedCardRef.current = null

    cleanupCarouselDrag()

    setIsDragging(false)
  }

  /*
   * ========================================
   * TRACK CLICK
   * ========================================
   *
   * Clicking outside a card clears the
   * pinned active state.
   */
  const handleTrackClick = (
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    const target = event.target as HTMLElement

    if (
      !target.closest(
        "[data-testimonial-card]",
      )
    ) {
      clearActiveCard()
    }
  }

  /*
   * ========================================
   * KEYBOARD
   * ========================================
   *
   * No navigation buttons are used anymore,
   * but keyboard users can still scroll.
   */
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    const track = trackRef.current

    if (!track) {
      return
    }

    if (
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight"
    ) {
      return
    }

    event.preventDefault()

    const card =
      cardRefs.current[0]

    if (!card) {
      return
    }

    const styles =
      window.getComputedStyle(track)

    const gap =
      parseFloat(
        styles.columnGap ||
          styles.gap ||
          "0",
      ) || 20

    const step =
      card.getBoundingClientRect().width +
      gap

    track.scrollBy({
      left:
        event.key === "ArrowRight"
          ? step
          : -step,
      behavior:
        prefersReducedMotion()
          ? "auto"
          : "smooth",
    })
  }

  /*
   * ========================================
   * DESKTOP HOVER
   * ========================================
   *
   * Hovering another card clears the pinned
   * active state, allowing CSS :hover to
   * control expansion naturally.
   */
  useEffect(() => {
    const track = trackRef.current

    if (!track) {
      return
    }

    const mediaQuery = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    )

    if (!mediaQuery.matches) {
      return
    }

    const cards =
      cardRefs.current.filter(
        (
          card,
        ): card is HTMLElement =>
          card !== null,
      )

    const cleanups = cards.map(
      (card) => {
        const handleEnter = () => {
          /*
           * If this card is already pinned,
           * don't change anything.
           */
          if (
            card.classList.contains(
              "is-active",
            )
          ) {
            return
          }

          /*
           * CSS :hover handles the visual
           * expansion. Clear only the pinned
           * state from another card.
           */
          clearActiveCard()
        }

        card.addEventListener(
          "mouseenter",
          handleEnter,
        )

        return () => {
          card.removeEventListener(
            "mouseenter",
            handleEnter,
          )
        }
      },
    )

    return () => {
      cleanups.forEach(
        (cleanup) => cleanup(),
      )
    }
  }, [clearActiveCard])

  /*
   * ========================================
   * CLEAR ACTIVE STATE OUTSIDE CARDS
   * ========================================
   */
  useEffect(() => {
    const handleDocumentPointerDown = (
      event: PointerEvent,
    ) => {
      if (!event.isPrimary) {
        return
      }

      const target =
        event.target as HTMLElement

      if (
        target.closest(
          "[data-testimonial-card]",
        )
      ) {
        return
      }

      clearActiveCard()
    }

    document.addEventListener(
      "pointerdown",
      handleDocumentPointerDown,
    )

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleDocumentPointerDown,
      )
    }
  }, [clearActiveCard])

  /*
   * ========================================
   * CUSTOM SCROLLBAR
   * ========================================
   *
   * Keeps the 75% centered scrollbar synced
   * with the native carousel scroll position.
   */
  useEffect(() => {
    const track = trackRef.current

    if (!track) {
      return
    }

    const updateScrollbar = () => {
      const maxScroll = track.scrollWidth - track.clientWidth

      if (maxScroll <= 0) {
        setScrollbarThumbWidth(100)
        setScrollbarThumbPosition(0)
        return
      }

      const visibleRatio =
        track.clientWidth / track.scrollWidth

      const thumbWidth = Math.max(
        visibleRatio * 100,
        18,
      )

      const maxThumbTravel = 100 - thumbWidth
      const progress = track.scrollLeft / maxScroll

      setScrollbarThumbWidth(thumbWidth)
      setScrollbarThumbPosition(
        progress * maxThumbTravel,
      )
    }

    updateScrollbar()

    track.addEventListener("scroll", updateScrollbar, {
      passive: true,
    })

    window.addEventListener("resize", updateScrollbar)

    return () => {
      track.removeEventListener(
        "scroll",
        updateScrollbar,
      )
      window.removeEventListener(
        "resize",
        updateScrollbar,
      )
    }
  }, [])

  const handleScrollbarPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    const track = trackRef.current
    const scrollbar = scrollbarRef.current

    if (!track || !scrollbar) {
      return
    }

    event.preventDefault()

    const scrollbarRect =
      scrollbar.getBoundingClientRect()

    const thumbWidthPx =
      (scrollbarThumbWidth / 100) *
      scrollbarRect.width

    const target = event.target as HTMLElement
    const thumb = target.closest<HTMLElement>(
      "[data-testimonial-scrollbar-thumb]",
    )

    if (thumb) {
      scrollbarDragRef.current = true
      scrollbarDragStartXRef.current =
        event.clientX

      const thumbRect =
        thumb.getBoundingClientRect()

      /*
       * Preserve the exact point where the user grabbed
       * the thumb so it does not jump when dragging starts.
       */
      scrollbarDragOffsetRef.current =
        event.clientX - thumbRect.left

      scrollbarDragStartPositionRef.current =
        scrollbarThumbPosition

      window.addEventListener(
        "pointermove",
        handleScrollbarPointerMove,
      )
      window.addEventListener(
        "pointerup",
        handleScrollbarPointerUp,
      )
      return
    }

    const clickProgress =
      (event.clientX - scrollbarRect.left) /
      scrollbarRect.width

    const clampedProgress = Math.max(
      0,
      Math.min(1, clickProgress),
    )

    track.scrollTo({
      left:
        clampedProgress *
        (track.scrollWidth - track.clientWidth),
      behavior: prefersReducedMotion()
        ? "auto"
        : "smooth",
    })

  }

  const handleScrollbarPointerMove = (
    event: PointerEvent,
  ) => {
    if (!scrollbarDragRef.current) {
      return
    }

    const scrollbar = scrollbarRef.current
    const track = trackRef.current

    if (!scrollbar || !track) {
      return
    }

    const scrollbarWidth =
      scrollbar.getBoundingClientRect().width

    const thumbWidthPx =
      (scrollbarThumbWidth / 100) *
      scrollbarWidth

    const maxThumbTravel =
      scrollbarWidth - thumbWidthPx

    if (maxThumbTravel <= 0) {
      return
    }

    const thumbStartPx =
      (scrollbarDragStartPositionRef.current / 100) *
      scrollbarWidth

    const pointerDelta =
      event.clientX -
      scrollbarDragStartXRef.current

    const newPosition = Math.max(
      0,
      Math.min(
        maxThumbTravel,
        thumbStartPx +
          pointerDelta,
      ),
    )

    const progress =
      newPosition / maxThumbTravel

    /*
     * Keep the scrollbar itself direct and immediate.
     * The carousel's normal snap behavior handles the
     * final resting position after the user releases.
     */
    track.style.scrollBehavior = "auto"

    track.scrollLeft =
      progress *
      (track.scrollWidth - track.clientWidth)
  }

  const handleScrollbarPointerUp = () => {
    scrollbarDragRef.current = false

    window.removeEventListener(
      "pointermove",
      handleScrollbarPointerMove,
    )
    window.removeEventListener(
      "pointerup",
      handleScrollbarPointerUp,
    )
  }

  useEffect(() => {
    return () => {
      cleanupCarouselDrag()
      handleScrollbarPointerUp()
    }
  }, [])
  /*
   * ========================================
   * RESIZE SAFETY
   * ========================================
   */
  useEffect(() => {
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

const handleResize = () => {
  if (resizeTimer) {
    clearTimeout(resizeTimer);
  }

  resizeTimer = setTimeout(() => {
    clearActiveCard();
  }, 150);
};

    window.addEventListener(
      "resize",
      handleResize,
    )

    return () => {
      window.removeEventListener(
        "resize",
        handleResize,
      )

      if (resizeTimer) {
        window.clearTimeout(
          resizeTimer,
        )
      }
    }
  }, [clearActiveCard])

  return (
  <section
    id="testimonials"
    className="relative overflow-visible px-5 pt-[calc(var(--header-offset,0px)+var(--header-height,100px))] pb-0 sm:px-6 lg:px-8"
    aria-labelledby="testimonials-heading"
  >
    <div className="mx-auto w-full max-w-[1240px]">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between gap-6 sm:mb-9">
        <div className="min-w-0" data-reveal>
          <h2
            id="testimonials-heading"
            className="min-w-0 max-w-full font-display text-[clamp(2.1rem,8vw,3.3rem)] font-medium leading-[1.05] tracking-[-0.02em] text-[var(--cream)]"
          >
            <span className="italic">
              What{" "}
            </span>

            <span className="font-brand text-[clamp(2.5rem,10vw,4.3rem)] leading-none text-[var(--secondary-light)]">
              couples
            </span>

            <span className="italic">
              {" "}say
            </span>
          </h2>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative w-full overflow-visible">
          <div
            ref={trackRef}
            tabIndex={0}
            role="region"
            aria-label="Client testimonials"
            onPointerDown={
              handlePointerDown
            }
            onPointerMove={
              handlePointerMove
            }
            onPointerUp={
              handlePointerUp
            }
            onPointerCancel={
              handlePointerCancel
            }
            onLostPointerCapture={
              handleLostPointerCapture
            }
            onClick={handleTrackClick}
            onKeyDown={handleKeyDown}
            className={[
  "testimonials-scroll-track",
  "flex w-full min-w-0 items-stretch",
  "gap-[clamp(16px,1.6vw,22px)]",
  "overflow-x-auto",
"snap-x snap-mandatory",
              "pl-[54px] pr-[76px] pb-14 pt-7",
              "touch-pan-auto",
              "cursor-grab",
              "outline-none",
              "focus-visible:ring-1 focus-visible:ring-[var(--secondary-light)]/50",

              /*
               * Edge fade — same approach as
               * the supplied CSS.
               */
              "[mask-image:linear-gradient(to_right,transparent_0,black_70px,black_calc(100%-70px),transparent_100%)]",
              "[-webkit-mask-image:linear-gradient(to_right,transparent_0,black_70px,black_calc(100%-70px),transparent_100%)]",

              "max-[960px]:gap-[18px]",
              "max-[960px]:px-12",

              "max-[768px]:gap-4",
              "max-[768px]:px-[42px]",
              "max-[768px]:pb-11",
              "max-[768px]:pt-5",

              /*
               * Smaller mobile fade.
               */
              "max-[768px]:[mask-image:linear-gradient(to_right,transparent_0,black_34px,black_calc(100%-34px),transparent_100%)]",
              "max-[768px]:[-webkit-mask-image:linear-gradient(to_right,transparent_0,black_34px,black_calc(100%-34px),transparent_100%)]",

              "max-[480px]:px-[38px]",

              /*
               * Very small mobile fade.
               */
              "max-[480px]:[mask-image:linear-gradient(to_right,transparent_0,black_26px,black_calc(100%-26px),transparent_100%)]",
              "max-[480px]:[-webkit-mask-image:linear-gradient(to_right,transparent_0,black_26px,black_calc(100%-26px),transparent_100%)]",

              isDragging
  ? "cursor-grabbing snap-none select-none [&_[data-testimonial-card]]:!transition-none [&_[data-testimonial-card]]:!transform-none"
  : "",
            ].join(" ")}
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {testimonials.map(
              (
                testimonial,
                index,
              ) => {
                const isActive =
                  activeIndex === index

                return (
                  <article
                    key={
                      testimonial.name
                    }
                    ref={(element) => {
                      cardRefs.current[
                        index
                      ] = element
                    }}
                    data-testimonial-card
                    data-testimonial-index={
                      index
                    }
                    tabIndex={0}
                    aria-label={`${testimonial.name}`}
                    onFocus={() =>
                      activateCard(
                        index,
                      )
                    }
                    onClick={(event) => {
                      if (isDragging) {
                        event.preventDefault()
                        return
                      }

                      activateCard(
                        index,
                      )
                    }}

                    className={[
  /*
   * Base card
   */
  "group relative isolate flex shrink-0",
  "basis-[330px]",
  "h-[420px]",
  "snap-start",
  "flex-col",
  "justify-end",
  "overflow-hidden",

  /*
   * Card shape
   *
   * top-left = rounded
   * top-right = sharp
   * bottom-right = rounded
   * bottom-left = sharp
   */
  "rounded-[calc(var(--radius-lg)*4)]",
  "rounded-tr-none",
  "rounded-bl-none",

  /*
   * Single clean card outline
   */
  "bg-[var(--primary-dark)]",
  "shadow-[inset_0_0_0_1px_rgba(184,151,93,0.34)]",

  "origin-center",
  "select-none",
  "p-7",

  "transition-[flex-basis,transform,box-shadow] duration-[400ms] ease-[var(--ease)]",

  "outline-none",
  "focus-visible:ring-1",
  "focus-visible:ring-[var(--secondary-light)]",

  /*
   * Tablet
   */
  "max-[960px]:basis-[310px]",
  "max-[960px]:h-[405px]",

  /*
   * Mobile
   */
  "max-[768px]:basis-[300px]",
  "max-[768px]:h-[400px]",
  "max-[768px]:p-6",

  /*
   * Small mobile
   */
  "max-[480px]:basis-[82vw]",
  "max-[480px]:h-[390px]",

  /*
   * Active / pinned state
   */
  isActive
    ? [
        "z-10",
        "basis-[390px]",
        "-translate-y-2",
        "shadow-[inset_0_0_0_1px_rgba(210,184,133,0.65),0_12px_26px_rgba(var(--primary-darkest-rgb),0.20),0_30px_68px_rgba(var(--primary-darkest-rgb),0.28)]",

        "max-[960px]:basis-[360px]",

        "max-[768px]:basis-[330px]",
        "max-[768px]:-translate-y-[5px]",

        "max-[480px]:basis-[92vw]",
      ].join(" ")
    : [ 
  "hover:z-10",
  ...(isDragging
    ? []
    : [
        "hover:basis-[390px]",
        "hover:-translate-y-2",
        "hover:shadow-[inset_0_0_0_1px_rgba(210,184,133,0.65),0_12px_26px_rgba(var(--primary-darkest-rgb),0.20),0_30px_68px_rgba(var(--primary-darkest-rgb),0.28)]",
        "max-[960px]:hover:basis-[360px]",
        "max-[768px]:hover:basis-[330px]",
        "max-[768px]:hover:-translate-y-[5px]",
        "max-[480px]:hover:basis-[92vw]",
      ]),
].join(" "),
].join(" ")}
>
                    {/* Image */}
                    <Image
                      src={
                        testimonial.image
                      }
                      alt={
                        testimonial.alt
                      }
                      fill
                      sizes="(max-width: 480px) 82vw, (max-width: 768px) 300px, (max-width: 960px) 310px, 330px"
                      className={[
                        "absolute inset-0",
                        "h-full w-full",
                        "object-cover",
                        "scale-100",

                        "transition-[transform,filter] duration-[400ms] ease-[var(--ease)]",

                        "group-hover:scale-[1.045]",

                        isActive
                          ? "scale-[1.045]"
                          : "",
                      ].join(" ")}
                      priority={
                        index < 2
                      }
                    />

                    {/* Resting image darkening */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(var(--primary-darkest-rgb),.02)_0%,rgba(var(--primary-darkest-rgb),.06)_40%,rgba(var(--primary-darkest-rgb),.22)_68%,rgba(var(--primary-darkest-rgb),.42)_100%)]"
                    />

                    {/* Hover / active darkening */}
<div
  aria-hidden="true"
  className={[
    "pointer-events-none absolute inset-0 z-[1]",
    "bg-black/50 opacity-0",
    "transition-opacity duration-[400ms] ease-[var(--ease)]",
    "group-hover:opacity-100",

    isActive
      ? "opacity-100"
      : "",
  ].join(" ")}
/>

                    {/* Bottom secondary-color fade */}
                    <div
                      aria-hidden="true"
                      className={[
                        "pointer-events-none absolute inset-x-0 bottom-0 z-[2]",
                        "h-[27%]",
                        "bg-[linear-gradient(0deg,var(--secondary-light)_0%,var(--secondary)_35%,rgba(210,184,133,.45)_64%,rgba(210,184,133,0)_100%)]",
                        "transition-[height,opacity] duration-[400ms] ease-[var(--ease)]",
                        "group-hover:h-[29%]",

                        isActive
                          ? "h-[29%]"
                          : "",
                      ].join(" ")}
                    />

                    {/* Quote mark */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute left-7 top-6 z-[4] font-display text-5xl leading-none text-[var(--secondary-light)]/70"
                    >
                      &ldquo;
                    </div>

                    {/* Testimonial text */}
                    <p
                      className={[
  "absolute bottom-[108px] left-7 right-7 z-[4]",
  "m-0 overflow-hidden",

  "font-display text-[0.98rem]",
  "italic",
  "indent-8",
  "font-normal leading-[1.55]",
  "text-[var(--cream)]",

  "[text-shadow:0_2px_14px_rgba(var(--primary-darkest-rgb),.90)]",

  // Hidden/resting position
  "translate-y-[32px]",
  "max-h-0",
  "opacity-0",

  // Delayed entrance from bottom
  "transition-[max-height,opacity,transform] duration-[500ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
  "group-hover:max-h-[190px]",
  "group-hover:translate-y-0",
  "group-hover:opacity-[0.98]",
  "group-hover:delay-[250ms]",

  // Active/pinned state
  isActive
    ? "max-h-[190px] translate-y-0 opacity-[0.98] delay-[150ms]"
    : "",

  /*
   * Closing quote
   */
  "after:ml-[3px]",
  "after:text-[1.35em]",
  "after:leading-[0]",
  "after:align-[-0.2em]",
  "after:text-[var(--secondary-light)]",
  "after:content-['\"']",

  "max-[768px]:left-6",
  "max-[768px]:right-6",
  "max-[768px]:bottom-[100px]",
].join(" ")}
                    >
                      {
                        testimonial.quote
                      }
                    </p>

                    {/* Client footer */}
                    <div className="absolute bottom-6 left-7 right-28 z-[5] flex min-w-0 items-center max-[768px]:bottom-[21px] max-[768px]:left-6 max-[768px]:right-[106px]">
                      <div className="min-w-0">
                        <h3 className="m-0 truncate text-[1.1rem] font-semibold leading-[1.2] text-[var(--primary)] max-[480px]:text-base">
                          {
                            testimonial.name
                          }
                        </h3>
                      </div>
                    </div>

                    {/* Rating */}
                    <div
                      className="absolute bottom-[25px] right-6 z-[5] flex gap-[3px] text-[0.76rem] tracking-[0.08em] text-[var(--primary)] max-[768px]:bottom-[22px] max-[768px]:right-5"
                      aria-label={`${testimonial.rating} out of 5 stars`}
                    >
                      <span aria-hidden="true">
                        {"★".repeat(
                          testimonial.rating,
                        )}
                      </span>
                    </div>
                  </article>
                )
              },
            )}
          </div>

          {/* Custom 75% centered scrollbar */}
          <div
            ref={scrollbarRef}
            role="scrollbar"
            aria-orientation="horizontal"
            aria-label="Testimonials scroll position"
            tabIndex={0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(
              scrollbarThumbPosition,
            )}
            onPointerDown={handleScrollbarPointerDown}
            className="mx-auto mt-1 h-[4px] w-[75%] touch-none select-none rounded-full bg-[var(--secondary-light)]/15"
          >
            <div
              data-testimonial-scrollbar-thumb
              className="h-full rounded-full bg-[var(--secondary-light)] transition-[background-color] duration-200 hover:bg-[var(--secondary)]"
              style={{
                width: `${scrollbarThumbWidth}%`,
                marginLeft: `${scrollbarThumbPosition}%`,
              }}
            />
          </div>
        </div>
      </div>
      {/* Reduced motion */} <style jsx>{` @media (prefers-reduced-motion: reduce) { #testimonials [data-testimonial-card], #testimonials [data-testimonial-card] *, #testimonials [data-testimonial-card]::before, #testimonials [data-testimonial-card]::after { transition: none !important; } #testimonials [role="region"] { scroll-behavior: auto !important; } } `}</style> </section> ) }