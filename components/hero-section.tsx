"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

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

function AnimatedCounter({
  target,
  label,
  start,
}: CounterProps) {
  const [value, setValue] = React.useState(0)

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
      const progress = Math.min(
        (now - startTime) / duration,
        1,
      )

      const eased =
        1 - Math.pow(1 - progress, 3)

      setValue(Math.floor(eased * target))

      if (progress < 1) {
        frameId = requestAnimationFrame(update)
      } else {
        setValue(target)
      }
    }

    frameId = requestAnimationFrame(update)

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [start, target])

  return (
    <div
      className="
        flex min-h-[76px] min-w-0 flex-col
        items-center justify-center gap-[5px]
        rounded-[clamp(12px,1.5vw,18px)]
        border border-[rgba(184,151,93,.34)]
        bg-[linear-gradient(135deg,rgba(255,255,255,.08),rgba(255,255,255,.025))]
        p-[clamp(10px,1.4vw,16px)]
        shadow-[0_8px_20px_rgba(0,0,0,.10)]
        transition-[transform,border-color,box-shadow]
        duration-[var(--speed)]
        ease-[var(--ease)]
        hover:-translate-y-1
        hover:border-[rgba(210,184,133,.58)]
        hover:shadow-[0_12px_28px_rgba(0,0,0,.16),0_8px_24px_var(--shadow-hover)]
        motion-reduce:transition-none
        motion-reduce:hover:translate-y-0
        max-[1100px]:min-h-[clamp(66px,7vw,76px)]
        max-[1100px]:p-[clamp(9px,1.2vw,14px)]
        max-[720px]:min-h-[clamp(64px,17vw,72px)]
        max-[720px]:p-[clamp(8px,2.5vw,12px)]
        max-[480px]:min-h-16 
        max-[480px]:px-1.5
        max-[480px]:py-2
      "
    >
      <h3
        className="
          m-0 font-display font-semibold leading-none
          text-[var(--secondary)]
          text-[clamp(1.25rem,1.6vw,2rem)]
          max-[1100px]:text-[clamp(1.15rem,2vw,1.7rem)]
          max-[720px]:text-[clamp(1.05rem,5vw,1.5rem)]
          max-[480px]:text-[clamp(1rem,5vw,1.35rem)]
        "
      >
        {value}+
      </h3>

      <span
        className="
          block text-center uppercase
          leading-[1.2] tracking-[.1em]
          text-[rgba(var(--cream-rgb),.68)]
          text-[clamp(.62rem,.65vw,.78rem)]
          max-[1100px]:text-[clamp(.58rem,.7vw,.72rem)]
          max-[720px]:text-[clamp(.56rem,2vw,.68rem)]
          max-[480px]:text-[.55rem]
        "
      >
        {label}
      </span>
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
        className="
          relative isolate w-full overflow-hidden
          px-5 pb-0
          pt-[calc(var(--header-offset,0px)+var(--header-height,100px))]
          sm:px-6
          lg:px-8
          [--hero-gutter:clamp(28px,4vw,72px)]
          [--hero-content-gap:clamp(20px,2.5vw,30px)]
          [--hero-visual-size:clamp(330px,42vw,580px)]
max-[1100px]:[--hero-visual-size:clamp(310px,44vw,530px)]
max-[560px]:[--hero-visual-size:none]
        "
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
                relative m-0 max-w-[42ch]
                pl-[18px]
                text-[clamp(.95rem,calc(.35vw+.85rem),1.08rem)]
                leading-[1.75]
                text-[rgba(var(--cream-rgb),.72)]
                before:absolute
                before:left-0
                before:top-[.5em]
                before:h-[calc(100%_-_1em)]
                before:w-0.5
                before:rounded-full
                before:bg-[linear-gradient(180deg,var(--secondary-light),var(--secondary))]
                before:shadow-[0_0_12px_rgba(184,151,93,.16)]
                max-[1100px]:text-[clamp(.9rem,1.4vw,1.02rem)]
                max-[720px]:mx-auto
                max-[720px]:max-w-[36ch]
                max-[720px]:pl-4
                max-[720px]:text-[clamp(.9rem,2.5vw,1rem)]
                max-[720px]:leading-[1.7]
                max-[720px]:text-center
                max-[720px]:before:left-0
                max-[720px]:before:top-1/2
                max-[720px]:before:h-[2.4em]
                max-[720px]:before:-translate-y-1/2
                max-[480px]:max-w-[34ch]
                max-[480px]:pl-[14px]
                max-[480px]:text-[.9rem]
              "
            >
              Luxe wedding and lifestyle photography
            </p>

            <h1
              id="hero-heading"
              data-reveal
              className="
                m-0 w-full max-w-full
                font-display font-bold
                leading-[.98]
                tracking-[-.035em]
                text-[var(--cream)]
                text-[clamp(3rem,calc(5vw+.5rem),5.75rem)]
                max-[1100px]:text-[clamp(2.8rem,5.5vw,4.8rem)]
                max-[720px]:text-[clamp(2.5rem,10vw,4rem)]
                max-[720px]:leading-none
                max-[480px]:text-[clamp(2.3rem,12vw,3.35rem)]
              "
            >
              Roselanes

              <span
                className="
                  mt-[.08em]
                  block w-full max-w-none
                  text-[1.08em]
                  font-extrabold italic
                  text-[var(--secondary-light)]
                "
              >
                Photography
              </span>
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
                <AnimatedCounter
                  target={500}
                  label="Events"
                  start={countersStarted}
                />

                <AnimatedCounter
                  target={6}
                  label="Years"
                  start={countersStarted}
                />

                <AnimatedCounter
                  target={120}
                  label="Clients"
                  start={countersStarted}
                />
              </div>

              {/* ACTION BUTTONS */}
              <div
                className="
                  flex w-auto max-w-full
                  flex-row flex-nowrap
                  gap-[clamp(8px,1.2vw,14px)]
                  max-[1100px]:w-full
                  max-[1100px]:max-w-[480px]
                  max-[1100px]:gap-[clamp(8px,1.2vw,12px)]
                  max-[720px]:mx-auto
                  max-[720px]:w-full
                  max-[720px]:max-w-[520px]
                  max-[480px]:gap-2
                "
              >
                <Button
                  asChild
                  className="
                    min-w-[150px]
                    shrink-0
                    whitespace-nowrap
                    !border-[var(--secondary)]
                    !bg-[var(--secondary)]
                    !text-[var(--primary-darkest)]
                    hover:!border-[var(--secondary-light)]
                    hover:!bg-[var(--secondary-light)]
                    max-[1100px]:min-w-0
                    max-[1100px]:px-[clamp(9px,1.3vw,18px)]
                    max-[1100px]:text-[clamp(.65rem,calc(.75vw+.22rem),.86rem)]
                    max-[720px]:w-1/2
                    max-[720px]:flex-1
                    max-[720px]:px-[clamp(8px,3vw,18px)]
                    max-[720px]:py-[clamp(10px,2.5vw,14px)]
                    max-[720px]:text-[clamp(.66rem,2.5vw,.88rem)]
                    max-[480px]:px-[7px]
                    max-[480px]:py-2.5
                    max-[480px]:text-[clamp(.64rem,2.7vw,.78rem)]
                  "
                >
                  <a href="/quote">
                    Get a Quote
                  </a>
                </Button>

                <Button
                  asChild
                  variant="secondary"
                  className="
                    min-w-[150px]
                    shrink-0
                    whitespace-nowrap
                    max-[1100px]:min-w-0
                    max-[1100px]:px-[clamp(9px,1.3vw,18px)]
                    max-[1100px]:text-[clamp(.65rem,calc(.75vw+.22rem),.86rem)]
                    max-[720px]:w-1/2
                    max-[720px]:flex-1
                    max-[720px]:px-[clamp(8px,3vw,18px)]
                    max-[720px]:py-[clamp(10px,2.5vw,14px)]
                    max-[720px]:text-[clamp(.66rem,2.5vw,.88rem)]
                    max-[480px]:px-[7px]
                    max-[480px]:py-2.5
                    max-[480px]:text-[clamp(.64rem,2.7vw,.78rem)]
                  "
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
          "
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

          {/* PREVIOUS */}
          <button
            type="button"
            onClick={showPreviousImage}
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
            onClick={showNextImage}
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
            className="
              relative
              flex
              h-full
              w-full
              items-center
              justify-center
              px-8
              py-12
              sm:px-14
              sm:py-14
            "
          >
            <Image
              src={HERO_IMAGES[lightboxIndex].src}
              alt={HERO_IMAGES[lightboxIndex].alt}
              width={1600}
              height={2000}
              priority
              sizes="100vw"
              className="
                max-h-[calc(100vh-7rem)]
                max-w-[calc(100vw-4rem)]
                w-auto
                rounded-[28px]
                object-contain
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
            {lightboxIndex + 1} / {HERO_IMAGES.length}
          </div>
        </div>,
          document.body,
        )}
    </>
  )
}

export default HeroSection