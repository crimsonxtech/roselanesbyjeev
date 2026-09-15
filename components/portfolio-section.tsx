"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { ZoomableLightboxImage } from "@/components/zoomable-lightbox-image";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";

const R2_BASE =
  "https://images.roselanesbyjeev.in/roselanesbyjeev/portfolio/gallery";

type PortfolioImage = {
  id: string;
  alt: string;
  width: number;
  height: number;
};

const portfolioImages: PortfolioImage[] = [
  {
    id: "b1689edb-6451-4004-98fd-029017ba59bd",
    alt: "Bride portrait",
    width: 1333,
    height: 2000,
  },
  {
    id: "8aa12ce4-478c-4770-b1a2-1a02bb5b1506",
    alt: "Bride portrait",
    width: 1333,
    height: 2000,
  },
  {
    id: "e6eefe33-7fea-46fa-8f5b-f7cb1f764b5f",
    alt: "Bride portrait",
    width: 1333,
    height: 2000,
  },
  {
    id: "80e0cf8f-1010-4d81-96fd-8ebabebc09b0",
    alt: "Bride portrait",
    width: 1333,
    height: 2000,
  },
  {
    id: "8e858620-ab5c-4931-a2ce-98492b1dcd43",
    alt: "Bride portrait",
    width: 1333,
    height: 2000,
  },
  {
    id: "f693c0e1-17cf-4b91-9040-c0e08ebe93fd",
    alt: "Bride portrait",
    width: 1333,
    height: 2000,
  },
  {
    id: "ff6a532c-bd7f-4a58-9047-f2dbae33e0cf",
    alt: "Bride portrait",
    width: 1333,
    height: 2000,
  },
  {
    id: "6e4b0e2c-7a81-4123-ba75-44aef47106e7",
    alt: "Bride portrait",
    width: 1333,
    height: 2000,
  },
  {
    id: "9a5ba915-c999-4a9a-a848-5080d2c7bb94",
    alt: "Bride portrait",
    width: 1333,
    height: 2000,
  },
  {
    id: "c6be2f22-72fd-4890-9c67-5bbbefca2912",
    alt: "Bride portrait",
    width: 1333,
    height: 2000,
  },
  {
    id: "df1c6991-0522-4527-b407-5196c02aeca4",
    alt: "Couple photography",
    width: 1080,
    height: 1350,
  },
  {
    id: "ae906b08-ad84-4dd0-8cd8-624a85084f9e",
    alt: "Couple photography",
    width: 1330,
    height: 2000,
  },
  {
    id: "97881ecd-832f-4418-8328-70a19eff3578",
    alt: "Couple photography",
    width: 1333,
    height: 2000,
  },
  {
    id: "e9f8e0ac-2eef-4188-9fb2-50946a4abbcf",
    alt: "Couple photography",
    width: 1333,
    height: 2000,
  },
  {
    id: "51ca6e36-8d88-420e-9e55-c0e12ebedb97",
    alt: "Couple photography",
    width: 1333,
    height: 2000,
  },
  {
    id: "ce043f7f-b9be-412e-9c28-229472e4aa9d",
    alt: "Couple photography",
    width: 1333,
    height: 2000,
  },
  {
    id: "b1d64a15-9752-4929-8838-d22b61b98e19",
    alt: "Couple photography",
    width: 951,
    height: 1426,
  },
  {
    id: "a605c776-8380-47f4-86ef-2ced8a79d4d7",
    alt: "Couple photography",
    width: 1333,
    height: 2000,
  },
  {
    id: "80aae8c9-cb60-47ed-b0a2-e5f3477d2378",
    alt: "Wedding reception",
    width: 1388,
    height: 2000,
  },
  {
    id: "e9aa4d0c-0a8f-48df-8e59-eb535d1109fc",
    alt: "Wedding reception",
    width: 1372,
    height: 2000,
  },
  {
    id: "a5875d88-49bc-4b01-a30d-f5f94bd39f4e",
    alt: "Wedding reception",
    width: 2000,
    height: 1393,
  },
  {
    id: "98c1efbb-c422-437e-9719-a6bb01f83ffa",
    alt: "Wedding reception",
    width: 1334,
    height: 2000,
  },
  {
    id: "fd98b2a8-4401-4576-b442-a8c83ce40c31",
    alt: "Wedding reception",
    width: 1435,
    height: 2000,
  },
  {
    id: "0b152599-aa21-44a2-b450-5301fd1ce95e",
    alt: "Wedding reception",
    width: 1356,
    height: 2000,
  },
  {
    id: "a124e500-304c-4b42-8186-65a845b3e1e6",
    alt: "Wedding reception",
    width: 1364,
    height: 2000,
  },
  {
    id: "64b98c75-2031-4529-9713-40960e84fdcd",
    alt: "Wedding photography",
    width: 1412,
    height: 2000,
  },
  {
    id: "f262efc8-5670-42aa-b0c2-36afa24e9cf4",
    alt: "Wedding photography",
    width: 2000,
    height: 1333,
  },
  {
    id: "5f1f3b67-a5ba-474d-80a2-4fd424fcaef5",
    alt: "Wedding photography",
    width: 2000,
    height: 1333,
  },
  {
    id: "546a8a91-767c-4236-aadc-06ee684e3e77",
    alt: "Wedding photography",
    width: 2000,
    height: 1381,
  },
  {
    id: "7c59df55-fcc9-4b51-ab01-92491668b721",
    alt: "Wedding photography",
    width: 1373,
    height: 2000,
  },
  {
    id: "ba0cade9-8954-4a0a-be86-a2235153851a",
    alt: "Wedding photography",
    width: 2000,
    height: 1330,
  },
  {
    id: "70616520-7997-4d06-a2f9-3341d01a2142",
    alt: "Wedding photography",
    width: 1333,
    height: 2000,
  },
  {
    id: "e563fb51-2448-4bb0-9bb3-9d2d59fe6000",
    alt: "Wedding photography",
    width: 1487,
    height: 2000,
  },
  {
    id: "a98c5748-5b2f-4a47-819f-2ddfc610813f",
    alt: "Wedding photography",
    width: 2000,
    height: 1333,
  },
  {
    id: "8ab068d2-bb63-4d9e-8eec-883e29e4201f",
    alt: "Wedding photography",
    width: 1333,
    height: 2000,
  },
];

function imageUrl(
  id: string,
  variant: "thumb" | "display",
) {
  return `${R2_BASE}/${id}/${variant}.webp`;
}

export function PortfolioSection() {
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

  const activeImage =
    activeIndex !== null
      ? portfolioImages[activeIndex]
      : null;

  const markErrored = React.useCallback((id: string) => {
    setErroredIds((current) => ({ ...current, [id]: true }));
  }, []);

  /*
   * Open lightbox.
   *
   * A temporary history entry is added so that the native
   * browser/device Back action can close the lightbox.
   */
  const openImage = React.useCallback((index: number) => {
    if (index < 0 || index >= portfolioImages.length) {
      return;
    }

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
  }, []);

  /*
   * Close lightbox.
   *
   * If the lightbox created a history entry, go back one
   * step so the URL/history stack returns to its original state.
   *
   * popstate then performs the actual lightbox state cleanup.
   */
  const closeImage = React.useCallback(() => {
    setActiveIndex((current) => {
      if (current === null) return current;

      if (lightboxHistoryRef.current) {
        closingFromHistoryRef.current = true;
        lightboxHistoryRef.current = false;
        window.history.back();
        return current;
      }

      return null;
    });
  }, []);

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
      setActiveIndex(null);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

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
  }, [activeIndex, closeImage]);

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
  }, []);

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
  }, []);

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
          pt-[calc(var(--header-offset,0px)+var(--header-height,100px))]
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

          {/* TRUE MASONRY */}
          <div
            aria-label="Wedding photography portfolio"
            className="
              columns-2
              [column-gap:10px]

              min-[640px]:columns-4
            "
          >
            {portfolioImages.map(
              (image, index) => {
                const isErrored = Boolean(erroredIds[image.id]);

                return (
                  <div
                    key={image.id}
                    className="mb-[10px] break-inside-avoid"
                  >
                  <button
                    type="button"
                    aria-label={`Open portfolio image ${
                      index + 1
                    } of ${portfolioImages.length}: ${image.alt}`}
                    onClick={() => openImage(index)}
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

                      focus-visible:outline-none
                      focus-visible:ring-2
                      focus-visible:ring-[var(--secondary-light)]
                      focus-visible:ring-offset-2
                      focus-visible:ring-offset-[var(--primary-darkest)]
                    "
                  >
                    {!isErrored ? (
                      <img
                        src={imageUrl(
                          image.id,
                          "thumb",
                        )}
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
                        onError={() => markErrored(image.id)}
                        className="
                          block
                          h-auto
                          w-full
                          object-cover
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
              },
            )}
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
          "
          style={{ overscrollBehavior: "none" }}
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
            className="
              relative
              flex
              h-full
              w-full
              items-center
              justify-center
              overflow-hidden
              px-8
              py-12
              sm:px-14
              sm:py-14
            "
          >
            <ZoomableLightboxImage
              key={activeImage.id}
              src={imageUrl(activeImage.id, "display")}
              alt={activeImage.alt}
              width={activeImage.width}
              height={activeImage.height}
              onSwipePrev={showPrevious}
              onSwipeNext={showNext}
              priority
              sizes="100vw"
              className="
                max-h-[calc(100svh-7rem)]
                max-w-[calc(100vw-4rem)]
                w-auto
                rounded-[28px]
                object-contain
                shadow-[0_24px_80px_rgba(0,0,0,.45)]
                sm:max-h-[calc(100svh-6rem)]
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
            {activeIndex + 1} / {portfolioImages.length}
          </div>
          </div>,
          document.body,
        )}
    </>
  );
}