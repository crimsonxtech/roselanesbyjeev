"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image"

export default function AboutSection() {
  const [heroActive, setHeroActive] = React.useState(false);

  const toggleHeroActive = () => {
    if (window.matchMedia("(hover: none), (pointer: coarse)").matches) {
      setHeroActive((active) => !active);
    }
  };

  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const sideRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [isTouchActive, setIsTouchActive] = React.useState(false);

  React.useEffect(() => {
    const wrapper = wrapperRef.current;
    const side = sideRef.current;
    const content = contentRef.current;

    if (!wrapper || !side || !content) return;

    const MIN_SCALE = 0.55;
    const STEP = 0.02;

    let rafId: number | null = null;

    const isStacked = () =>
      window.getComputedStyle(wrapper).display === "flex";

    const fitContent = () => {
      if (isStacked()) {
        content.style.removeProperty("--fit-scale");
        content.style.removeProperty("max-height");
        return;
      }

      content.style.setProperty("--fit-scale", "1");
      content.style.removeProperty("max-height");

      const targetHeight = side.getBoundingClientRect().height;

      if (!targetHeight) return;

      let scale = 1;
      let contentHeight = content.getBoundingClientRect().height;

      while (contentHeight > targetHeight && scale > MIN_SCALE) {
        scale = Math.max(MIN_SCALE, scale - STEP);

        content.style.setProperty(
          "--fit-scale",
          scale.toFixed(3),
        );

        contentHeight = content.getBoundingClientRect().height;
      }

      content.style.maxHeight = `${targetHeight}px`;
    };

    const scheduleFit = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(fitContent);
    };

    scheduleFit();

    window.addEventListener("load", scheduleFit);
    window.addEventListener("resize", scheduleFit);

    let resizeObserver: ResizeObserver | null = null;

    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(scheduleFit);
      resizeObserver.observe(side);
    }

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      window.removeEventListener("load", scheduleFit);
      window.removeEventListener("resize", scheduleFit);
      resizeObserver?.disconnect();
    };
  }, []);

  React.useEffect(() => {
    if (!isTouchActive) return;

    const resetOnOutsideTap = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && sideRef.current?.contains(target)) return;
      setIsTouchActive(false);
    };

    document.addEventListener("pointerdown", resetOnOutsideTap);
    return () => {
      document.removeEventListener("pointerdown", resetOnOutsideTap);
    };
  }, [isTouchActive]);

  const cardClass = `
    relative
    w-full
    rounded-[28px]
    border
    border-[rgba(210,184,133,.16)]
    bg-[linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.018))]
    backdrop-blur-[14px]
    backdrop-saturate-[1.15]
    transition-[transform,box-shadow,border-color]
    duration-[.4s]
    ease
    hover:-translate-y-1
    hover:border-[rgba(210,184,133,.30)]
    hover:shadow-[0_26px_58px_rgba(0,0,0,.26),inset_0_1px_0_rgba(255,255,255,.10)]
    motion-reduce:transition-none
    motion-reduce:hover:translate-y-0
    [@media(prefers-reduced-transparency:reduce)]:bg-[var(--glass-bg-solid)]
    [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none
    [@media(prefers-reduced-transparency:reduce)]:backdrop-saturate-100
  `;

  const bodyTextClass = `
    m-0
    max-w-[62ch]
    text-left
    text-[calc(clamp(1.05rem,1.3vw,1.22rem)*var(--fit-scale,1))]
    font-normal
    leading-[1.65]
    text-[rgba(var(--cream-rgb),.82)]
  `;

  const ctaClass = `
    !min-w-0
    !w-full
    !flex-[0_1_auto]
    !min-h-[60px]
    !px-[clamp(10px,4.5cqi,34px)]
    !text-[clamp(.66rem,2.4cqi,.88rem)]
    !whitespace-nowrap
    !overflow-hidden
    !text-ellipsis
  `;

  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="px-5 pb-0 pt-[calc(var(--header-offset,0px)+var(--header-height,100px))] sm:px-6 lg:px-8"
    >
      <div className="mx-auto w-full max-w-[1240px]">
        {/* HEADER — intentionally identical to Contact */}
        <header className="mb-8 sm:mb-9">
          <h2
            id="about-heading"
            data-reveal
            className="font-serif text-[clamp(2.3rem,4.5vw,3.4rem)] font-normal leading-[1.05] tracking-[-0.03em] text-[var(--cream)]"
          >
            About{" "}
            <span className="inline-block italic text-[var(--secondary-light)]">
              Roselanes
            </span>
          </h2>
        </header>

        {/* ABOUT CONTENT */}
        <div
          ref={wrapperRef}
          className="
            grid
            grid-cols-[minmax(0,1fr)_minmax(0,1fr)]
            items-start
            gap-[clamp(48px,6vw,96px)]
            max-[960px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]
            max-[960px]:gap-[clamp(20px,2.5vw,56px)]
            max-[768px]:flex
            max-[768px]:flex-col
            max-[768px]:gap-9
          "
        >
          {/* =====================================================
              LEFT — HERO VISUAL
              ===================================================== */}

          <div
            ref={sideRef}
            className="
              flex
              w-full
              min-w-0
              max-w-[380px]
              flex-col
              items-center
              justify-self-center
              self-start
              mx-auto
              [container-type:inline-size]
              max-[960px]:max-w-[360px]
              max-[768px]:order-2
              max-[768px]:w-full
              max-[768px]:max-w-[380px]
              max-[768px]:mx-auto
            "
          >
            {/* HERO VISUAL */}

            <div
              data-reveal
              data-reveal-delay="120"
              className={`
                group
                ${heroActive ? "is-active" : ""}
                relative
                isolate
                mx-auto
                w-full
                max-w-[380px]
                [container-type:inline-size]
                py-[7.37cqi]

                before:pointer-events-none
                before:absolute
                before:-right-[17.1cqi]
                before:-top-[19.7cqi]
                before:-z-[3]
                before:h-[81.6cqi]
                before:w-[81.6cqi]
                before:blur-[clamp(20px,7.37cqi,28px)]
                before:content-['']
                before:[background:radial-gradient(circle,rgba(224,190,120,.46)_0%,rgba(224,190,120,.24)_27%,rgba(224,190,120,.09)_50%,transparent_73%)]

                after:pointer-events-none
                after:absolute
                after:-bottom-[34.2cqi]
                after:-right-[35.5cqi]
                after:-z-[4]
                after:h-[94.7cqi]
                after:w-[94.7cqi]
                after:blur-[clamp(30px,11.84cqi,45px)]
                after:content-['']
                after:[background:radial-gradient(circle,rgba(var(--primary-light-rgb),.24),rgba(var(--primary-rgb),.10)_35%,transparent_70%)]

                max-[960px]:max-w-[360px]
                max-[600px]:max-w-[340px]

              `}
              onClick={toggleHeroActive}
              role="button"
              tabIndex={0}
              aria-pressed={heroActive}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  toggleHeroActive();
                }
              }}
            >
              {/* BACK STACK CARD */}

              <div
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute
                  right-[.53cqi]
                  top-[4.74cqi]
                  z-0
                  aspect-[5/8]
                  w-[70%]
                  rotate-[-5deg]
                  translate-x-[-3.68cqi]
                  rounded-[clamp(21px,7.37cqi,28px)_0_clamp(21px,7.37cqi,28px)_0]
                  border
                  border-[rgba(210,184,133,.16)]
                  bg-[linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.012))]
                  shadow-[0_28px_65px_rgba(0,0,0,.24),inset_0_1px_0_rgba(255,255,255,.07)]
                  transition-transform
                  duration-[.4s]
                  ease

                  group-hover:rotate-[-7deg]
                  group-[.is-touch-active]:rotate-[-7deg] group-[.is-active]:rotate-[-7deg]
                  group-hover:translate-x-[-2.1cqi]
                  group-[.is-touch-active]:translate-x-[-2.1cqi] group-[.is-active]:translate-x-[-2.1cqi]
                  group-hover:translate-y-[-1.32cqi]
                  group-[.is-touch-active]:translate-y-[-1.32cqi] group-[.is-active]:translate-y-[-1.32cqi]



                  motion-reduce:transition-none
                  motion-reduce:group-hover:rotate-[-5deg]
                  motion-reduce:group-hover:translate-x-[-3.68cqi]
                  motion-reduce:group-hover:translate-y-0

                  [@media(prefers-reduced-transparency:reduce)]:bg-[var(--glass-bg-solid)]
                  [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none
                "
              />
              <div
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute
                  right-[5.26cqi]
                  top-[3.16cqi]
                  z-0
                  aspect-[5/8]
                  w-[70%]
                  rotate-[5deg]
                  translate-x-[-3.68cqi]
                  rounded-[clamp(21px,7.37cqi,28px)_0_clamp(21px,7.37cqi,28px)_0]
                  border
                  border-[rgba(210,184,133,.16)]
                  bg-[linear-gradient(145deg,rgba(255,255,255,.065),rgba(255,255,255,.012))]
                  shadow-[0_28px_65px_rgba(0,0,0,.24),inset_0_1px_0_rgba(255,255,255,.07)]
                  transition-transform
                  duration-[.4s]
                  ease

                  group-hover:rotate-[8deg]
                  group-[.is-touch-active]:rotate-[8deg] group-[.is-active]:rotate-[8deg]
                  group-hover:translate-x-[-4.21cqi]
                  group-[.is-touch-active]:translate-x-[-4.21cqi] group-[.is-active]:translate-x-[-4.21cqi]
                  group-hover:translate-y-[-2.1cqi]
                  group-[.is-touch-active]:translate-y-[-2.1cqi]
                  group-[.is-touch-active]:translate-y-[-2.1cqi] group-[.is-active]:translate-y-[-2.1cqi]



                  motion-reduce:transition-none
                  motion-reduce:group-hover:rotate-[-5deg]
                  motion-reduce:group-hover:translate-x-[-3.68cqi]
                  motion-reduce:group-hover:translate-y-0

                  [@media(prefers-reduced-transparency:reduce)]:bg-[var(--glass-bg-solid)]
                  [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none
                "
              />

              {/* MAIN IMAGE FRAME */}

              <div
                className="
                  group/frame
                  relative
                  z-[2]
                  mx-auto
                  aspect-[5/8]
                  w-[70%]
                  overflow-visible
                  rotate-[1.2deg]
                  rounded-[28px_0_28px_0]
                  border
                  border-[rgba(235,205,150,.27)]
                  border-t-[rgba(238,221,184,.46)]
                  border-r-[rgba(210,184,133,.34)]
                  bg-[linear-gradient(145deg,rgba(255,255,255,.14)_0%,rgba(210,184,133,.18)_8%,rgba(255,255,255,.055)_24%,rgba(255,255,255,.025)_100%)]
                  p-[2.37cqi]
                  shadow-[0_32px_72px_rgba(0,0,0,.44),0_10px_30px_rgba(0,0,0,.20),inset_0_1px_0_rgba(255,255,255,.16),inset_0_-1px_0_rgba(0,0,0,.20)]
                  backdrop-blur-[12px]
                  backdrop-saturate-[1.2]
                  transition-[transform,box-shadow]
                  duration-[.4s]
                  ease

                  hover:translate-y-[-2.1cqi]
                  group-[.is-touch-active]:translate-y-[-2.1cqi] group-[.is-active]:translate-y-[-2.1cqi]
                  hover:rotate-0
                  group-[.is-touch-active]:rotate-0 group-[.is-active]:rotate-0
                  hover:shadow-[0_42px_90px_rgba(0,0,0,.52),0_0_50px_rgba(210,184,133,.11),inset_0_1px_0_rgba(255,255,255,.20),inset_0_-1px_0_rgba(0,0,0,.18)]
                  group-[.is-active]:shadow-[0_42px_90px_rgba(0,0,0,.52),0_0_50px_rgba(210,184,133,.11),inset_0_1px_0_rgba(255,255,255,.20),inset_0_-1px_0_rgba(0,0,0,.18)]

                  motion-reduce:transition-none
                  motion-reduce:hover:rotate-[1.2deg]
                  motion-reduce:hover:translate-y-0

                  [@media(prefers-reduced-transparency:reduce)]:bg-[var(--glass-bg-solid)]
                  [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none

                  before:pointer-events-none
                  before:absolute
                  before:-inset-[3.68cqi_-4.74cqi_3.68cqi_4.74cqi]
                  before:-z-[1]
                  before:rounded-[clamp(27px,9.47cqi,36px)_0_clamp(27px,9.47cqi,36px)_0]
                  before:border
                  before:border-[rgba(210,184,133,.17)]
                  before:bg-[linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.012))]
                  before:shadow-[0_22px_52px_rgba(0,0,0,.20),inset_0_1px_0_rgba(255,255,255,.06)]
                  before:rotate-[4deg]
                  before:transition-transform
                  before:duration-[.4s]
                  before:ease

                  hover:before:rotate-[5deg]
                  group-[.is-touch-active]:before:rotate-[5deg] group-[.is-active]:before:rotate-[5deg]
                  hover:before:translate-x-[1.32cqi]
                  group-[.is-touch-active]:before:translate-x-[1.32cqi] group-[.is-active]:before:translate-x-[1.32cqi]
                  hover:before:translate-y-[-1.05cqi]
                  group-[.is-touch-active]:before:translate-y-[-1.05cqi] group-[.is-active]:before:translate-y-[-1.05cqi]

                  motion-reduce:before:transition-none
                  motion-reduce:hover:before:rotate-[4deg]
                  motion-reduce:hover:before:translate-x-0
                  motion-reduce:hover:before:translate-y-0

                  after:pointer-events-none
                  after:absolute
                  after:inset-[2.37cqi]
                  after:z-[3]
                  after:rounded-[clamp(16px,5.53cqi,21px)_0_clamp(16px,5.53cqi,21px)_0]
                  after:content-['']
                  after:[background:linear-gradient(180deg,rgba(var(--primary-darkest-rgb),0)_44%,rgba(var(--primary-darkest-rgb),.08)_62%,rgba(var(--primary-darkest-rgb),.50)_100%)]


                "
              >
<img
  src="https://images.roselanesbyjeev.in/roselanesbyjeev/portfolio/about/08cf1a04-712f-4ca9-946a-888e109a2bdf.webp"
  alt="Portrait of the Roselanes founder"
  loading="lazy"
  decoding="async"
  className="
    relative
    z-[1]
    block
    size-full
    object-cover
    rounded-[clamp(16px,5.53cqi,21px)_0_clamp(16px,5.53cqi,21px)_0]
    shadow-[inset_0_0_0_1px_rgba(255,255,255,.045)]
    transition-transform
    duration-700
    ease
    group-hover/frame:scale-[1.035]
    group-[.is-touch-active]:scale-[1.035] group-[.is-active]:scale-[1.035]
    motion-reduce:transition-none
    motion-reduce:group-hover/frame:scale-100
  "
/>
              </div>
            </div>
            {/* =====================================================
                FOUNDER
                ===================================================== */}

            <div
              data-reveal
              data-reveal-delay="280"
              className="
                mb-6
                flex
                items-center
                justify-center
                gap-[14px]
                self-center
              "
            >
              <span
                aria-hidden="true"
                className="
                  h-[34px]
                  w-1
                  shrink-0
                  bg-[var(--secondary)]
                "
              />

              <div className="min-w-0">
                <h4
                  className="
                    m-0
                    text-base
                    font-extrabold
                    leading-[1.3]
                    text-[var(--cream)]
                  "
                >
                  Jeevan
                </h4>

                <span
                  className="
                    block
                    text-[.7rem]
                    font-extrabold
                    uppercase
                    leading-[1.2]
                    tracking-[.12em]
                    text-[var(--secondary)]
                  "
                >
                  Founder &amp; Lead Photographer
                </span>
              </div>
            </div>

            {/* =====================================================
                CTA
                ===================================================== */}

            <div
              data-reveal
              data-reveal-delay="320"
              className="
                flex
                w-full
                flex-row
                flex-nowrap
                items-center
                justify-center
                gap-[clamp(6px,2cqi,12px)]
              "
            >
              <Button
                asChild
                className={`
                  ${ctaClass}
                  !border-[var(--secondary)]
                  !bg-[var(--secondary)]
                  !text-[var(--primary-darkest)]
                  hover:!border-[var(--secondary-light)]
                  hover:!bg-[var(--secondary-light)]
                `}
              >
                <a
  href="#contact"
  onClick={(event) => {
    event.preventDefault();
    document.getElementById("contact")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }}
>
  Work With Us
</a>
              </Button>

              <Button
                asChild
                variant="secondary"
                className={ctaClass}
              >
                <a
                    href="#portfolio"
                    onClick={(event) => {
                      event.preventDefault();
                      document
                        .getElementById("portfolio")
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    }}
                  >
                    View Portfolio →
                  </a>
              </Button>
            </div>
          </div>

          {/* =====================================================
              RIGHT — TEXT CONTENT
              ===================================================== */}

          <div
            ref={contentRef}
            className="
              flex
              min-w-0
              flex-col
              items-stretch
              gap-[calc(24px*var(--fit-scale,1))]
              overflow-visible
              max-[768px]:order-1
              max-[768px]:w-full
            "
            style={
              {
                "--fit-scale": 1,
              } as React.CSSProperties
            }
          >
            {/* INTRO */}

            <div
              data-reveal
              data-reveal-delay="80"
              className={`
                ${cardClass}
                p-[calc(clamp(22px,2.6vw,34px)*var(--fit-scale,1))_calc(clamp(20px,2.8vw,32px)*var(--fit-scale,1))]
              `}
            >
              <p className={bodyTextClass}>
                Roselanes by Jeev Photography is inspired by the language
                of a rose — where every petal speaks of love, every bloom
                holds an emotion, and every fragrance carries a feeling.
                Just like a rose, we believe the purest emotions deserve
                to be cherished. Through our frames, we preserve the love,
                laughter, tears, romance, and countless unspoken feelings
                that make every story beautifully yours.
              </p>
            </div>

            {/* STORY */}

            <div
              data-reveal
              data-reveal-delay="160"
              className={`
                ${cardClass}
                p-[calc(clamp(22px,2.6vw,34px)*var(--fit-scale,1))_calc(clamp(20px,2.8vw,32px)*var(--fit-scale,1))]
              `}
            >
              <p className={bodyTextClass}>
                I know that one day, these photographs will become more
                than just photographs to you. Years from now, I want you
                to look back at a frame and feel it all again — the laughter,
                the tears, the nervous smiles, and the warmth of the people
                you love. For me, photography is not just about capturing
                what happened. It is about understanding your story and
                preserving the little emotions that make it truly yours.
                My promise is simple — to capture your day not just as it
                looked, but as your heart remembers it.
              </p>
            </div>

            {/* QUOTE */}

            <div
              data-reveal
              data-reveal-delay="240"
              className={`
                ${cardClass}
                border-[rgba(210,184,133,.26)]
                bg-[linear-gradient(145deg,rgba(255,255,255,.08),rgba(var(--primary-light-rgb),.12)_70%)]
                py-[calc(clamp(22px,2.6vw,34px)*var(--fit-scale,1))]
                pr-[calc(clamp(20px,2.8vw,32px)*var(--fit-scale,1))]
                pl-[calc(clamp(44px,5vw,58px)*var(--fit-scale,1))]
                before:pointer-events-none
                before:absolute
                before:top-[6px]
                before:left-[calc(clamp(14px,2vw,20px)*var(--fit-scale,1))]
                before:font-serif
                before:text-[calc(clamp(2.6rem,4vw,3.4rem)*var(--fit-scale,1))]
                before:italic
                before:leading-none
                before:text-[var(--secondary)]
                before:opacity-[.55]
                before:content-['“']
              `}
            >
              <p
                className="
                  m-0
                  max-w-[52ch]
                  text-left
                  text-[calc(clamp(1.05rem,1.3vw,1.22rem)*var(--fit-scale,1))]
                  font-normal
                  italic
                  leading-[1.65]
                  text-[var(--secondary-light)]
                "
              >
                When the moment fades, let the feeling remain — blooming
                forever through every frame.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}