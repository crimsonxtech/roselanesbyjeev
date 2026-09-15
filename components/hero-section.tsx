"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dancing_Script } from "next/font/google"
import { ZoomableLightboxImage } from "@/components/zoomable-lightbox-image"
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock"

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-dancing-script",
})

type CounterProps = {
  target: number
  label: string
  start: boolean
}

type HeroImage = {
  src: string
  alt: string
  width: number
  height: number
}

const HERO_IMAGES: HeroImage[] = [
  {
    src: "https://images.roselanesbyjeev.in/roselanesbyjeev/portfolio/hero/a39513c3-f6e6-4ee3-ad7a-742768d2e7c9.webp",
    alt: "Portrait of the Roselanes photographer",
    width: 1067,
    height: 1600,
  },
  {
    src: "https://images.roselanesbyjeev.in/roselanesbyjeev/portfolio/hero/fdf149a3-93d9-487b-a14a-92554065b56f.webp",
    alt: "Roselanes wedding photography",
    width: 800,
    height: 1200,
  },
  {
    src: "https://images.roselanesbyjeev.in/roselanesbyjeev/portfolio/hero/e90ddf4e-df1a-4248-b8ad-5809deeed47e.webp",
    alt: "Roselanes wedding photography",
    width: 800,
    height: 1200,
  },
  {
    src: "https://images.roselanesbyjeev.in/roselanesbyjeev/portfolio/hero/0436c077-4616-4704-aca5-cd6a3513c7d6.webp",
    alt: "Roselanes wedding photography",
    width: 800,
    height: 1200,
  },
]

/**
 * Scales its children's font-size so the rendered line
 * width matches `targetPercent` of the parent container's
 * width. Recalculates on mount and on container resize.
 */
function FitText({
  children,
  targetPercent = 0.8,
  minFontSize = 10,
  maxFontSize = 400,
  className = "",
}: {
  children: React.ReactNode
  targetPercent?: number
  minFontSize?: number
  maxFontSize?: number
  className?: string
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const textRef = React.useRef<HTMLSpanElement>(null)
  const [fontSize, setFontSize] = React.useState<number | null>(null)

  React.useLayoutEffect(() => {
    const container = containerRef.current
    const textEl = textRef.current
    if (!container || !textEl) return

    const recalc = () => {
      const containerWidth = container.offsetWidth
      if (!containerWidth) return

      const referenceFontSize = 100
      const previousInlineSize = textEl.style.fontSize
      textEl.style.fontSize = `${referenceFontSize}px`
      const textWidth = textEl.scrollWidth
      textEl.style.fontSize = previousInlineSize

      if (!textWidth) return

      const targetWidth = containerWidth * targetPercent
      const rawSize = (targetWidth / textWidth) * referenceFontSize
      const clampedSize = Math.min(
        Math.max(rawSize, minFontSize),
        maxFontSize,
      )

      setFontSize(clampedSize)
    }

    recalc()

    const resizeObserver = new ResizeObserver(recalc)
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [targetPercent, minFontSize, maxFontSize, children])

  return (
    <div ref={containerRef} className="w-full">
      <span
        ref={textRef}
        className={className}
        style={{
          display: "inline-block",
          whiteSpace: "nowrap",
          fontSize: fontSize ? `${fontSize}px` : undefined,
        }}
      >
        {children}
      </span>
    </div>
  )
}

function StatCard({
  target,
  label,
  start,
}: CounterProps) {
  const [value, setValue] = React.useState(0)
  const [active, setActive] = React.useState(false)
  const lastPointerType = React.useRef<string>("mouse")

  React.useEffect(() => {
    if (!active) return

    const handleOutsideTap = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return
      const target = event.target as HTMLElement
      if (target.closest("[data-hero-stat]")) return
      setActive(false)
    }

    document.addEventListener("pointerdown", handleOutsideTap)
    return () => document.removeEventListener("pointerdown", handleOutsideTap)
  }, [active])

  React.useEffect(() => {
    if (!start) return

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches

    if (reducedMotion) {
      setValue(target)
      return
    }

    const duration = 1500
    const startTime = performance.now()
    let frameId = 0

    const update = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      setValue(Math.floor(eased * target))

      if (progress < 1) {
        frameId = requestAnimationFrame(update)
      } else {
        setValue(target)
      }
    }

    frameId = requestAnimationFrame(update)

    return () => cancelAnimationFrame(frameId)
  }, [start, target])

  return (
    <div
      data-hero-stat
      data-reveal
      data-reveal-group="hero-stats"
      data-reveal-stagger="80"
      onPointerDown={(event) => {
        lastPointerType.current = event.pointerType
      }}
      onClick={() => {
        if (lastPointerType.current !== "touch") return
        setActive((current) => !current)
      }}
      className={`
        group relative min-w-0 cursor-pointer overflow-hidden rounded-[18px]
        border border-[var(--glass-border)] bg-[var(--glass-bg)] p-[clamp(6px,0.9vw,10px)]
        shadow-[0_18px_45px_rgba(0,0,0,.28),inset_0_1px_0_rgba(255,255,255,.07)]
        backdrop-blur-xl
        transition-all duration-300
        hover:-translate-y-1
        hover:border-[var(--secondary)]/35
        hover:shadow-[0_25px_55px_rgba(0,0,0,.38)]
        focus-within:-translate-y-1
        focus-within:border-[var(--secondary)]/35
        focus-within:shadow-[0_25px_55px_rgba(0,0,0,.38)]
        ${
          active
            ? "-translate-y-1 border-[var(--secondary)]/35 shadow-[0_25px_55px_rgba(0,0,0,.38)]"
            : ""
        }
        motion-reduce:transition-none
        motion-reduce:hover:translate-y-0
        [@media(prefers-reduced-transparency:reduce)]:bg-[var(--glass-bg-solid)]
        [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none
      `}
    >
      <div className="relative flex min-h-[52px] min-w-0 flex-col items-center justify-center gap-[3px]">
        <h3
          className="
            m-0 font-display font-semibold leading-none
            text-[clamp(1.25rem,1.6vw,2rem)]
            text-[var(--secondary)]
            transition-colors duration-300
            group-hover:text-[var(--secondary-light)]
            max-[1100px]:text-[clamp(1.15rem,2vw,1.7rem)]
            max-[720px]:text-[clamp(1.05rem,5vw,1.5rem)]
            max-[480px]:text-[clamp(1rem,5vw,1.35rem)]
          "
        >
          {value}+
        </h3>

        <span
          className="
            block text-center uppercase leading-[1.2] tracking-[.1em]
            text-[rgba(var(--cream-rgb),.68)]
            text-[clamp(.62rem,.65vw,.78rem)]
            max-[720px]:text-[clamp(.56rem,2vw,.68rem)]
            max-[480px]:text-[.55rem]
          "
        >
          {label}
        </span>
      </div>
    </div>
  )
}

export function HeroSection() {
  const heroRef = React.useRef<HTMLElement>(null)

  const [countersStarted, setCountersStarted] =
    React.useState(false)

  const [lightboxIndex, setLightboxIndex] =
    React.useState<number | null>(null)

  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  /*
   * Tracks whether the currently open lightbox owns
   * a temporary browser history entry.
   *
   * This is what allows native browser/device Back
   * to close the lightbox instead of leaving the page.
   */
  const lightboxHistoryRef = React.useRef(false)

  /*
   * Prevents duplicate history operations when closing
   * through X / ESC while the browser is already processing
   * a popstate event.
   */
  const closingFromHistoryRef = React.useRef(false)

  React.useEffect(() => {
    const hero = heroRef.current

    if (!hero) return

    if (!("IntersectionObserver" in window)) {
      setCountersStarted(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return

        setCountersStarted(true)
        observer.disconnect()
      },
      {
        threshold: 0.25,
      },
    )

    observer.observe(hero)

    return () => {
      observer.disconnect()
    }
  }, [])

  /*
   * Open lightbox.
   *
   * A temporary history entry is added so that the native
   * browser/device Back action can close the lightbox.
   */
  const openLightbox = React.useCallback(
    (index: number) => {
      if (index < 0 || index >= HERO_IMAGES.length) {
        return
      }

      setLightboxIndex(index)

      window.history.pushState(
        {
          ...window.history.state,
          heroLightbox: true,
        },
        "",
        window.location.href,
      )

      lightboxHistoryRef.current = true
      closingFromHistoryRef.current = false
    },
    [],
  )

  /*
   * Close lightbox.
   *
   * If the lightbox created a history entry, go back one
   * step so the URL/history stack returns to its original state.
   *
   * popstate then performs the actual lightbox state cleanup.
   */
  const closeLightbox = React.useCallback(() => {
    if (lightboxIndex === null) return

    if (lightboxHistoryRef.current) {
      closingFromHistoryRef.current = true
      lightboxHistoryRef.current = false

      window.history.back()
      return
    }

    setLightboxIndex(null)
  }, [lightboxIndex])

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
      lightboxHistoryRef.current = false
      closingFromHistoryRef.current = false
      setLightboxIndex(null)
    }

    window.addEventListener(
      "popstate",
      handlePopState,
    )

    return () => {
      window.removeEventListener(
        "popstate",
        handlePopState,
      )
    }
  }, [])

  /*
   * Lock page scrolling while the lightbox is open.
   */
  React.useEffect(() => {
    if (lightboxIndex === null) return

    const previousOverflow =
      document.body.style.overflow

    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow =
        previousOverflow
    }
  }, [lightboxIndex])

  /*
   * Lock page scrolling while the lightbox is open.
   * Uses the same iOS-safe fixed-position scroll lock as the portfolio lightbox.
   */
  useBodyScrollLock(lightboxIndex !== null)

  /*
   * Keyboard controls:
   *
   * ESC        -> close
   * ArrowLeft  -> previous image
   * ArrowRight -> next image
   */
  React.useEffect(() => {
    if (lightboxIndex === null) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        closeLightbox()
        return
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault()

        setLightboxIndex((current) => {
          if (current === null) return null

          return current === 0
            ? HERO_IMAGES.length - 1
            : current - 1
        })

        return
      }

      if (event.key === "ArrowRight") {
        event.preventDefault()

        setLightboxIndex((current) => {
          if (current === null) return null

          return current === HERO_IMAGES.length - 1
            ? 0
            : current + 1
        })
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    )

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      )
    }
  }, [lightboxIndex, closeLightbox])

  /*
   * Keep focus on the close button when the lightbox opens.
   */
  const closeButtonRef =
    React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (lightboxIndex === null) return

    const frameId =
      requestAnimationFrame(() => {
        closeButtonRef.current?.focus()
      })

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [lightboxIndex])

  /*
   * Previous image.
   */
  const showPreviousImage = React.useCallback(() => {
    setLightboxIndex((current) => {
      if (current === null) return null

      return current === 0
        ? HERO_IMAGES.length - 1
        : current - 1
    })
  }, [])

  /*
   * Next image.
   */
  const showNextImage = React.useCallback(() => {
    setLightboxIndex((current) => {
      if (current === null) return null

      return current === HERO_IMAGES.length - 1
        ? 0
        : current + 1
    })
  }, [])

  return (
    <>
      <section
        ref={heroRef}
        id="hero"
        aria-labelledby="hero-heading"
        className={`
          ${dancingScript.variable}
          relative isolate w-full overflow-visible
          px-5 pb-0
          pt-[calc(var(--header-offset,0px)+var(--header-height,100px))]
          sm:px-6
          lg:px-8
          [--hero-gutter:clamp(28px,4vw,72px)]
          [--hero-content-gap:clamp(20px,2.5vw,30px)]
          [--hero-visual-size:clamp(330px,42vw,580px)]
max-[1100px]:[--hero-visual-size:clamp(310px,44vw,530px)]
max-[560px]:[--hero-visual-size:none]
        `}
      >
        <div
          className="
            mx-auto grid w-full max-w-[1240px] min-w-0
            items-center
            grid-cols-[minmax(0,1fr)_minmax(0,1fr)]
            gap-[var(--hero-gutter)]
            max-[1100px]:[--hero-gutter:clamp(20px,3vw,42px)]
            max-[1100px]:[--hero-content-gap:clamp(18px,2.5vw,26px)]
            max-[1100px]:[--hero-visual-size:clamp(310px,44vw,530px)]
              max-[720px]:flex
            max-[720px]:flex-col
            max-[720px]:gap-[clamp(34px,7vw,48px)]
          "
        >
          {/* LEFT CONTENT */}
          <div
            className="
              relative z-10 flex min-w-0
              max-w-[650px] flex-col
              items-start
              gap-[var(--hero-content-gap)]
              text-left
              max-[720px]:order-2
              max-[720px]:mx-auto
              max-[720px]:w-full
              max-[720px]:max-w-[680px]
              max-[720px]:items-center
              max-[720px]:text-center
              max-[720px]:[--hero-content-gap:clamp(18px,4vw,24px)]
              max-[480px]:[--hero-content-gap:18px]
            "
          >
<p
  data-reveal
  data-reveal-delay="80"
  className="
    relative m-0 w-max max-w-full
    pl-[22px]
    leading-[1.65]
    text-[rgba(var(--cream-rgb),.82)]
    before:absolute
    before:left-0
    before:top-[.5em]
    before:h-[calc(100%_-_1em)]
    before:w-0.5
    before:rounded-full
    before:bg-[linear-gradient(180deg,var(--secondary-light),var(--secondary))]
    before:shadow-[0_0_12px_rgba(184,151,93,.16)]
    max-[720px]:mx-auto
    max-[720px]:pl-5
    max-[720px]:text-center
    max-[720px]:before:left-0
    max-[720px]:before:top-1/2
    max-[720px]:before:h-[2.4em]
    max-[720px]:before:-translate-y-1/2
    max-[480px]:pl-4
  "
>
  <span
    className="
      block whitespace-nowrap
      pl-[3px]
      font-[family-name:var(--font-dancing-script)] font-bold
      tracking-[.005em]
      text-[clamp(1.1rem,calc(.7vw+.9rem),2.15rem)]
      max-[1100px]:text-[clamp(1rem,2vw,1.7rem)]
      max-[720px]:text-[clamp(.95rem,3.4vw,1.5rem)]
      max-[480px]:text-[clamp(.8rem,4.3vw,1.2rem)]
      bg-[linear-gradient(90deg,var(--secondary-dark)_0%,var(--secondary)_38%,var(--secondary-light)_72%,var(--cream)_100%)]
      bg-clip-text text-transparent
      drop-shadow-[0_1px_1px_rgba(0,0,0,.35)]
    "
  >
    Luxé wedding and lifestyle photography
  </span>
</p>

            <h1
              id="hero-heading"
              data-reveal
              className="
                m-0 w-full max-w-full
                font-display font-semibold
                leading-[.9]
                tracking-[-.03em]
                text-[var(--cream)]
              "
            >
              <FitText targetPercent={0.8} minFontSize={32} maxFontSize={140}>
                <span className="italic">A</span>{" "}
                <span className="font-brand text-[var(--secondary)]">
                  Wedding
                </span>
              </FitText>
              <FitText
                targetPercent={0.5}
                minFontSize={20}
                maxFontSize={110}
                className="italic"
              >
                Theory
              </FitText>
            </h1>

            <div
              data-reveal
              data-reveal-delay="160"
              className="
              
                flex w-full flex-col
                items-start
                gap-[var(--hero-content-gap)]
                max-[720px]:items-center
              "
            >
              {/* COUNTERS */}
              <div
                className="
                  grid w-full max-w-[520px]
                  grid-cols-3
                  gap-[clamp(10px,1.2vw,16px)]
                  max-[1100px]:max-w-[480px]
                  max-[1100px]:gap-[clamp(8px,1vw,13px)]
                  max-[720px]:mx-auto
                  max-[720px]:max-w-[520px]
                  max-[720px]:gap-[clamp(7px,2vw,11px)]
                  max-[480px]:gap-[7px]
                "
              >
                <StatCard target={500} label="Events" start={countersStarted} />

                <StatCard target={6} label="Years" start={countersStarted} />

                <StatCard target={120} label="Clients" start={countersStarted} />
              </div>

              {/* ACTION BUTTONS */}
              <div
                className="
                  flex w-full
                  max-w-[520px]
                  flex-row flex-nowrap
                  gap-[clamp(8px,1.2vw,14px)]
                  [container-type:inline-size]
                  overflow-visible
                  max-[1100px]:max-w-[480px]
                  max-[720px]:mx-auto
                  max-[720px]:max-w-[520px]
                "
              >
                <Button
                  asChild
                  className="
                    !min-w-0
                    flex-1
                    !border-[var(--secondary)]
                    !bg-[var(--secondary)]
                    !text-[var(--primary-darkest)]
                    !shadow-[0_14px_40px_rgba(0,0,0,.20)]
                    hover:!border-[var(--secondary-light)]
                    hover:!bg-[var(--secondary-light)]
                    hover:!shadow-[0_18px_48px_rgba(0,0,0,.26)]
                  "
                  style={
                    {
                      "--btn-padding-x": "clamp(10px, 6cqw, 34px)",
                      "--btn-font-size": "clamp(.6rem, 3.2cqw, .88rem)",
                      "--btn-letter-spacing": "clamp(.02em, .6cqw, .14em)",
                      "--btn-min-height": "clamp(40px, 13cqw, 60px)",
                    } as React.CSSProperties
                  }
                >
                  <a
                    href="/quote"
                    className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
                  >
                    Get a Quote
                  </a>
                </Button>

                <Button
                  asChild
                  variant="secondary"
                  className="!min-w-0 flex-1"
                  style={
                    {
                      "--btn-padding-x": "clamp(10px, 6cqw, 34px)",
                      "--btn-font-size": "clamp(.6rem, 3.2cqw, .88rem)",
                      "--btn-letter-spacing": "clamp(.02em, .6cqw, .14em)",
                      "--btn-min-height": "clamp(40px, 13cqw, 60px)",
                    } as React.CSSProperties
                  }
                >
                  <a
                    href="#portfolio"
                    onClick={(event) => {
                      event.preventDefault()
                      document
                        .getElementById("portfolio")
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        })
                    }}
                    className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap"
                  >
                    Explore Portfolio →
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* HERO VISUAL */}
          <div
            data-reveal
            data-reveal-delay="120"
            className="
              relative isolate
              mx-auto
              w-full
              max-w-[var(--hero-visual-size)]
              aspect-[9/10]
              overflow-visible
              [perspective:1200px]
              max-[720px]:order-1
              max-[720px]:w-[min(94vw,480px)]
              max-[560px]:w-[94vw]
              max-[480px]:w-[94vw]
            "
          >
            {/* MAIN IMAGE */}
            <button
              type="button"
              onClick={() => openLightbox(0)}
              aria-label="Open main photograph"
              className="
                absolute
                left-1/2
                top-[6%]
                z-10
                block
                w-[68%]
                -translate-x-1/2
                overflow-visible
                rounded-[clamp(22px,3vw,36px)]
                border-[1.5px]
                border-[var(--secondary)]
                bg-transparent
                p-0
                text-left
                transition-transform
                duration-500
                ease-[var(--ease)]
                hover:-translate-y-2
                hover:rotate-0
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[var(--secondary-light)]
                focus-visible:ring-offset-2
                focus-visible:ring-offset-[var(--primary-darkest)]
                motion-reduce:transition-none
              "
            >
              <Image
                src={HERO_IMAGES[0].src}
                alt={HERO_IMAGES[0].alt}
                width={HERO_IMAGES[0].width}
                height={HERO_IMAGES[0].height}
                draggable={false}
                priority
                sizes="(max-width: 560px) 64vw, (max-width: 720px) 60vw, 34vw"
                className="
                  block h-auto w-full
                  rounded-[clamp(22px,3vw,36px)]
                  object-contain
                  object-center
                "
              />
            </button>

            {/* FLOATING IMAGE 1 */}
            <button
              type="button"
              onClick={() => openLightbox(1)}
              aria-label="Open photograph"
              className="
                hero-floating-image
                absolute
                left-[1%]
                top-[2%]
                z-[2]
                w-[26%]
                overflow-visible
                rounded-[clamp(14px,2vw,24px)]
                border-[1.5px]
                border-[var(--secondary)]
                bg-transparent
                p-0
                text-left
                will-change-transform
                motion-reduce:animate-none
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[var(--secondary-light)]
                focus-visible:ring-offset-2
                focus-visible:ring-offset-[var(--primary-darkest)]
                max-[480px]:left-[1.5%]
              "
              style={{
                animation:
                  "hero-float 7s ease-in-out infinite",
              }}
            >
              <Image
                src={HERO_IMAGES[1].src}
                alt={HERO_IMAGES[1].alt}
                width={HERO_IMAGES[1].width}
                height={HERO_IMAGES[1].height}
                draggable={false}
                sizes="(max-width: 480px) 24vw, 10vw"
                className="
                  block h-auto w-full
                  rounded-[clamp(14px,2vw,24px)]
                  object-contain
                "
              />
            </button>

            {/* FLOATING IMAGE 2 */}
            <button
              type="button"
              onClick={() => openLightbox(2)}
              aria-label="Open photograph"
              className="
                hero-floating-image
                absolute
                bottom-[4%]
                left-[4%]
                z-[2]
                w-[25%]
                overflow-visible
                rounded-[clamp(14px,2vw,24px)]
                border-[1.5px]
                border-[var(--secondary)]
                bg-transparent
                p-0
                text-left
                will-change-transform
                motion-reduce:animate-none
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[var(--secondary-light)]
                focus-visible:ring-offset-2
                focus-visible:ring-offset-[var(--primary-darkest)]
                max-[480px]:left-[4%]
              "
              style={{
                animation:
                  "hero-float 7s ease-in-out infinite 1.4s",
              }}
            >
              <Image
                src={HERO_IMAGES[2].src}
                alt={HERO_IMAGES[2].alt}
                width={HERO_IMAGES[2].width}
                height={HERO_IMAGES[2].height}
                draggable={false}
                sizes="(max-width: 480px) 23vw, 10vw"
                className="
                  block h-auto w-full
                  rounded-[clamp(14px,2vw,24px)]
                  object-contain
                "
              />
            </button>

            {/* FLOATING IMAGE 3 */}
            <button
              type="button"
              onClick={() => openLightbox(3)}
              aria-label="Open photograph"
              className="
                hero-floating-image
                absolute
                right-0
                top-[16%]
                z-[2]
                w-[22%]
                overflow-visible
                rounded-[clamp(14px,2vw,24px)]
                border-[1.5px]
                border-[var(--secondary)]
                bg-transparent
                p-0
                text-left
                will-change-transform
                motion-reduce:animate-none
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-[var(--secondary-light)]
                focus-visible:ring-offset-2
                focus-visible:ring-offset-[var(--primary-darkest)]
                max-[480px]:right-[1.5%]
              "
              style={{
                animation:
                  "hero-float 7s ease-in-out infinite 2.8s",
              }}
            >
              <Image
                src={HERO_IMAGES[3].src}
                alt={HERO_IMAGES[3].alt}
                width={HERO_IMAGES[3].width}
                height={HERO_IMAGES[3].height}
                draggable={false}
                sizes="(max-width: 480px) 20vw, 9vw"
                className="
                  block h-auto w-full
                  rounded-[clamp(14px,2vw,24px)]
                  object-contain
                "
              />
            </button>
          </div>
        </div>

        {/* HERO ANIMATION */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes hero-float {
                0%, 100% {
                  transform: translateY(0);
                }

                50% {
                  transform: translateY(-10px);
                }
              }
            `,
          }}
        />
      </section>

      {/* FULL-SCREEN LIGHTBOX */}
      {mounted &&
        lightboxIndex !== null &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Image viewer"
            className="
              fixed inset-0 z-[999999]
              flex items-center justify-center
              bg-black/95 p-4 backdrop-blur-sm
              sm:p-6 lg:p-10
            "
            style={{ overscrollBehavior: "none" }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeLightbox()
              }
            }}
          >
            {/* SINGLE CLOSE CONTROL */}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeLightbox}
              aria-label="Close image viewer"
              className="
                absolute right-4 top-4 z-50
                flex size-11 items-center justify-center
                rounded-full border border-white/15 bg-black/50
                text-white backdrop-blur-md transition
                hover:bg-white/10
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-white/80
                sm:right-6 sm:top-6
              "
            >
              <X className="size-5" />
            </button>

            {/* PREVIOUS */}
            <button
              type="button"
              onClick={showPreviousImage}
              aria-label="Previous image"
              className="
                absolute left-3 top-1/2 z-40
                flex size-10 -translate-y-1/2 items-center justify-center
                rounded-full border border-white/10 bg-black/35
                text-2xl text-white backdrop-blur-md transition
                hover:bg-white/10
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-white/80
                sm:left-6 sm:size-11
              "
            >
              ‹
            </button>

            {/* NEXT */}
            <button
              type="button"
              onClick={showNextImage}
              aria-label="Next image"
              className="
                absolute right-3 top-1/2 z-40
                flex size-10 -translate-y-1/2 items-center justify-center
                rounded-full border border-white/10 bg-black/35
                text-2xl text-white backdrop-blur-md transition
                hover:bg-white/10
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-white/80
                sm:right-6 sm:size-11
              "
            >
              ›
            </button>

            {/* IMAGE */}
            <div
              className="
                relative flex h-full w-full items-center justify-center
                overflow-hidden px-8 py-12
                sm:px-14 sm:py-14
              "
            >
              <ZoomableLightboxImage
                key={HERO_IMAGES[lightboxIndex].src}
                src={HERO_IMAGES[lightboxIndex].src}
                alt={HERO_IMAGES[lightboxIndex].alt}
                width={HERO_IMAGES[lightboxIndex].width}
                height={HERO_IMAGES[lightboxIndex].height}
                onSwipePrev={showPreviousImage}
                onSwipeNext={showNextImage}
                priority
                sizes="100vw"
                className="
                  max-h-[calc(100vh-7rem)]
                  max-w-[calc(100vw-4rem)]
                  w-auto rounded-[28px] object-contain
                  shadow-[0_24px_80px_rgba(0,0,0,.45)]
                  sm:max-h-[calc(100vh-6rem)]
                  sm:max-w-[calc(100vw-8rem)]
                "
              />
            </div>

            {/* IMAGE COUNTER */}
            <div
              aria-live="polite"
              className="
                pointer-events-none absolute bottom-5 left-1/2
                -translate-x-1/2 rounded-full border border-white/10
                bg-black/45 px-3 py-1.5 text-xs tracking-[.12em]
                text-white/75 backdrop-blur-md
              "
            >
              {lightboxIndex + 1} / {HERO_IMAGES.length}
            </div>
          </div>,
          document.body,
        )}

    </>
  )
}

export default HeroSection