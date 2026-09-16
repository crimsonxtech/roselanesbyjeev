"use client";

import * as React from "react";
import {
  ArrowUpRight,
  Instagram,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

/*
 * ============================================================
 * ROSELANES FOOTER
 *
 * Important:
 * - This footer intentionally DOES NOT use the site background.
 * - No backdrop-blur.
 * - No glass effect.
 * - No transparency that exposes the animated background.
 *
 * The solid background + layered positioning creates the subtle
 * "shutter opening" reveal when the page reaches the footer.
 * ============================================================
 */

const NAV_ITEMS = [
  { label: "Home", href: "#hero" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
] as const;

const FOOTER_STYLES = `
  /*
   * ==========================================================
   * FOOTER SHUTTER REVEAL
   * ==========================================================
   *
   * The footer itself remains completely opaque.
   * The content above it naturally scrolls away, revealing the
   * footer underneath. There is deliberately no backdrop-filter
   * or transparent glass layer here.
   */

  #siteFooter {
    position: relative;
    z-index: 1;
    isolation: isolate;
    background: var(--primary-darkest, #2b0510);
    color: var(--cream);
    overflow: hidden;
  }

  #siteFooter,
  #siteFooter *,
  #siteFooter *::before,
  #siteFooter *::after {
    box-sizing: border-box;
  }

  /*
   * Very restrained ambient depth.
   * This is part of the FOOTER itself, not the site background.
   * It cannot reveal or inherit the animated SiteBackground.
   */
  #siteFooter::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -2;
    pointer-events: none;

    background:
      radial-gradient(
        ellipse at 50% 0%,
        rgba(131, 17, 50, .26),
        transparent 52%
      ),
      linear-gradient(
        180deg,
        #3f0a18 0%,
        #2b0510 48%,
        #24040d 100%
      );
  }

  /*
   * Fine upper edge.
   * This is intentionally subtle so the footer feels like it is
   * sitting behind the page rather than beginning as another card.
   */
  #siteFooter::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    pointer-events: none;

    background:
      linear-gradient(
        90deg,
        transparent,
        rgba(210, 184, 133, .42) 22%,
        rgba(210, 184, 133, .58) 50%,
        rgba(210, 184, 133, .42) 78%,
        transparent
      );
  }

  #siteFooter .footer-inner {
    width: 100%;
    max-width: 1240px;
    margin: 0 auto;
    padding:
      clamp(64px, 8vw, 108px)
      clamp(20px, 4vw, 64px)
      26px;
  }

  /*
   * ==========================================================
   * TOP
   * ==========================================================
   */

  #siteFooter .footer-top {
    display: grid;
    grid-template-columns:
      minmax(0, 1.65fr)
      minmax(150px, .75fr)
      minmax(180px, .9fr);

    gap: clamp(42px, 7vw, 110px);
    align-items: start;
  }

  /*
   * ==========================================================
   * BRAND
   * ==========================================================
   */

  #siteFooter .footer-brand {
    min-width: 0;
  }

  #siteFooter .footer-logo {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    text-decoration: none;
    outline: none;
  }

  #siteFooter .footer-logo img {
    display: block;
    width: auto;
    height: clamp(62px, 7vw, 86px);
    max-width: min(100%, 260px);
    object-fit: contain;
  }

  #siteFooter .footer-tagline {
    max-width: 480px;
    margin: 23px 0 0;

    color: rgba(var(--cream-rgb), .64);
    font-size: clamp(.82rem, .76rem + .2vw, .94rem);
    font-weight: 500;
    line-height: 1.75;
    letter-spacing: .01em;
  }

  #siteFooter .footer-signature {
    margin: 20px 0 0;

    color: var(--secondary-light, #eeddb8);
    font-family: var(--font-brand, cursive);
    font-size: clamp(1.45rem, 2vw, 1.9rem);
    line-height: 1;
  }

  /*
   * ==========================================================
   * SECTION LABEL
   * ==========================================================
   */

  #siteFooter .footer-label {
    display: flex;
    align-items: center;
    gap: 9px;

    margin: 0 0 18px;

    color: var(--secondary, #d2b885);
    font-size: 10px;
    font-weight: 800;
    line-height: 1;
    text-transform: uppercase;
    letter-spacing: .18em;
  }

  #siteFooter .footer-label::before {
    content: "";
    display: block;

    width: 18px;
    height: 1px;

    background: var(--secondary, #d2b885);
  }

  /*
   * ==========================================================
   * NAVIGATION
   * ==========================================================
   */

  #siteFooter .footer-nav {
    min-width: 0;
  }

  #siteFooter .footer-nav-list {
    display: flex;
    flex-direction: column;
    align-items: flex-start;

    gap: 10px;

    margin: 0;
    padding: 0;

    list-style: none;
  }

  #siteFooter .footer-nav-link {
    position: relative;

    display: inline-flex;
    align-items: center;

    min-height: 30px;

    color: rgba(var(--cream-rgb), .68);
    text-decoration: none;

    font-size: 13px;
    font-weight: 600;
    letter-spacing: .04em;

    transition:
      color 280ms cubic-bezier(.22, 1, .36, 1),
      transform 280ms cubic-bezier(.22, 1, .36, 1);
  }

  #siteFooter .footer-nav-link::after {
    content: "";

    position: absolute;
    left: 0;
    bottom: 2px;

    width: 0;
    height: 1px;

    background: var(--secondary, #d2b885);

    transition:
      width 300ms cubic-bezier(.22, 1, .36, 1);
  }

  #siteFooter .footer-nav-link:hover {
    color: var(--secondary-light, #eeddb8);
    transform: translateX(3px);
  }

  #siteFooter .footer-nav-link:hover::after {
    width: 100%;
  }

  /*
   * ==========================================================
   * CONTACT
   * ==========================================================
   */

  #siteFooter .footer-contact {
    min-width: 0;
  }

  #siteFooter .footer-contact-list {
    display: flex;
    flex-direction: column;

    gap: 14px;

    margin: 0;
    padding: 0;

    list-style: none;
  }

  #siteFooter .footer-contact-link {
    display: inline-flex;
    align-items: flex-start;
    gap: 10px;

    max-width: 100%;

    color: rgba(var(--cream-rgb), .68);
    text-decoration: none;

    font-size: 13px;
    font-weight: 500;
    line-height: 1.5;

    transition: color 280ms ease;
  }

  #siteFooter .footer-contact-link svg {
    width: 15px;
    height: 15px;
    flex: 0 0 auto;

    margin-top: 2px;

    color: var(--secondary, #d2b885);

    transition:
      color 280ms ease,
      transform 280ms ease;
  }

  #siteFooter .footer-contact-link:hover {
    color: var(--secondary-light, #eeddb8);
  }

  #siteFooter .footer-contact-link:hover svg {
    color: var(--secondary-light, #eeddb8);
    transform: translateY(-1px);
  }

  /*
   * ==========================================================
   * INSTAGRAM
   * ==========================================================
   */

  #siteFooter .footer-instagram {
    display: inline-flex;
    align-items: center;
    gap: 9px;

    margin-top: 22px;

    color: var(--secondary-light, #eeddb8);
    text-decoration: none;

    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .12em;

    transition:
      color 280ms ease,
      transform 280ms ease;
  }

  #siteFooter .footer-instagram svg {
    width: 17px;
    height: 17px;
  }

  #siteFooter .footer-instagram:hover {
    color: #fff;
    transform: translateY(-1px);
  }

  /*
   * ==========================================================
   * GOLD DIVIDER
   * ==========================================================
   */

  #siteFooter .footer-divider {
    position: relative;

    width: 100%;
    height: 1px;

    margin: clamp(48px, 7vw, 82px) 0 22px;

    background:
      linear-gradient(
        90deg,
        rgba(210,184,133,0),
        rgba(210,184,133,.34) 20%,
        rgba(210,184,133,.48) 50%,
        rgba(210,184,133,.34) 80%,
        rgba(210,184,133,0)
      );
  }

  /*
   * ==========================================================
   * BOTTOM BAR
   * ==========================================================
   */

  #siteFooter .footer-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;

    color: rgba(var(--cream-rgb), .38);

    font-size: 10px;
    font-weight: 600;
    line-height: 1.5;
    letter-spacing: .08em;
  }

  #siteFooter .footer-copyright {
    margin: 0;
  }

  /*
   * Pixtack credit:
   * intentionally understated — it should feel like a signature,
   * not an advertisement.
   */

  #siteFooter .footer-credit {
    display: inline-flex;
    align-items: center;
    gap: 5px;

    color: rgba(var(--cream-rgb), .38);

    text-decoration: none;
    white-space: nowrap;

    transition: color 250ms ease;
  }

  #siteFooter .footer-credit:hover {
    color: var(--secondary-light, #eeddb8);
  }

  #siteFooter .footer-credit-brand {
    color: rgba(210,184,133,.72);
  }

  /*
   * ==========================================================
   * BACK TO TOP
   * ==========================================================
   */

  #siteFooter .footer-top-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;

    min-height: 36px;
    padding: 0 13px;

    border: 1px solid rgba(210,184,133,.22);
    border-radius: 999px;

    background: transparent;

    color: rgba(var(--cream-rgb), .58);

    font-family: inherit;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .12em;
    text-transform: uppercase;

    cursor: pointer;

    transition:
      color 280ms ease,
      border-color 280ms ease,
      background 280ms ease,
      transform 280ms ease;
  }

  #siteFooter .footer-top-button svg {
    width: 13px;
    height: 13px;

    transition: transform 280ms ease;
  }

  #siteFooter .footer-top-button:hover {
    color: var(--secondary-light, #eeddb8);
    border-color: rgba(210,184,133,.48);
    background: rgba(210,184,133,.06);
    transform: translateY(-2px);
  }

  #siteFooter .footer-top-button:hover svg {
    transform: translateY(-2px);
  }

  /*
   * ==========================================================
   * TABLET
   * ==========================================================
   */

  @media (max-width: 820px) {
    #siteFooter .footer-top {
      grid-template-columns:
        minmax(0, 1fr)
        minmax(140px, .7fr);

      gap: 42px 56px;
    }

    #siteFooter .footer-brand {
      grid-column: 1 / -1;
    }
  }

  /*
   * ==========================================================
   * MOBILE
   * ==========================================================
   */

  @media (max-width: 560px) {
    #siteFooter .footer-inner {
      padding:
        58px
        20px
        22px;
    }

    #siteFooter .footer-top {
      display: flex;
      flex-direction: column;
      gap: 36px;
    }

    #siteFooter .footer-brand {
      width: 100%;
    }

    #siteFooter .footer-nav,
    #siteFooter .footer-contact {
      width: 100%;
    }

    #siteFooter .footer-nav-list {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6px 18px;
    }

    #siteFooter .footer-nav-link {
      min-height: 32px;
    }

    #siteFooter .footer-bottom {
      align-items: flex-start;
      flex-direction: column;
      gap: 13px;
    }

    #siteFooter .footer-top-button {
      align-self: flex-start;
    }
  }

  /*
   * ==========================================================
   * REDUCED MOTION
   * ==========================================================
   */

  @media (prefers-reduced-motion: reduce) {
    #siteFooter *,
    #siteFooter *::before,
    #siteFooter *::after {
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
    }
  }
`;

export default function Footer() {
  const handleTop = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();

      window.scrollTo({
        top: 0,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    },
    [],
  );

  const handleNavigation = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      if (!href.startsWith("#")) return;

      event.preventDefault();

      const target = document.querySelector(href);

      if (!target) return;

      target.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });

      window.history.replaceState(null, "", href);
    },
    [],
  );

  return (
    <>
      <style>{FOOTER_STYLES}</style>

      <footer id="siteFooter" aria-label="Roselanes footer">
        <div className="footer-inner">
          {/* ==================================================
              TOP CONTENT
              ================================================== */}
          <div className="footer-top">
            {/* BRAND */}
            <div className="footer-brand">
              <a
                href="#hero"
                className="footer-logo"
                aria-label="Roselanes by Jeev — Home"
                onClick={(event) => handleNavigation(event, "#hero")}
              >
                <img
                  src="/brand/logo.svg"
                  alt="Roselanes by Jeev"
                />
              </a>

              <p className="footer-tagline">
                Wedding photography that preserves the feeling, not just
                the frame.
              </p>

              <p className="footer-signature">
                with love, Roselanes!
              </p>
            </div>

            {/* NAVIGATION */}
            <nav
              className="footer-nav"
              aria-label="Footer navigation"
            >
              <p className="footer-label">Explore</p>

              <ul className="footer-nav-list">
                {NAV_ITEMS.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="footer-nav-link"
                      onClick={(event) =>
                        handleNavigation(event, item.href)
                      }
                    >
                      {item.label}
                    </a>
                  </li>
                ))}

                <li>
                  <a
                    href="/quote"
                    className="footer-nav-link"
                  >
                    Get a Quote
                  </a>
                </li>
              </ul>
            </nav>

            {/* CONTACT */}
            <div className="footer-contact">
              <p className="footer-label">Connect</p>

              <ul className="footer-contact-list">
                <li>
                  <a
                    href="mailto:roselanesbyjeev@gmail.com"
                    className="footer-contact-link"
                  >
                    <Mail aria-hidden="true" />
                    <span>
                      roselanesbyjeev@gmail.com
                    </span>
                  </a>
                </li>

                <li>
                  <a
                    href="tel:+919550044475"
                    className="footer-contact-link"
                  >
                    <Phone aria-hidden="true" />
                    <span>
                      +91 95500 44475
                    </span>
                  </a>
                </li>

                <li>
                  <a
                    href="https://wa.me/919550044475"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-contact-link"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.198.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.372-.075-.372-.075-.198 0-.52.075-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982 1-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.986 2.894a9.825 9.825 0 012.893 6.994c-.002 5.45-4.437 9.883-9.885 9.883m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.89c0 2.096.547 4.142 1.588 5.945L.057 24l6.304-1.654a11.875 11.875 0 005.684 1.448h.005c6.554 0 11.89-5.335 11.893-11.89a11.84 11.84 0 00-3.479-8.416" />
                    </svg>

                    <span>WhatsApp</span>
                  </a>
                </li>
              </ul>

              <a
                href="https://www.instagram.com/roselanes_by_jeev/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-instagram"
              >
                <Instagram aria-hidden="true" />
                <span>@roselanes_by_jeev</span>
                <ArrowUpRight
                  aria-hidden="true"
                  style={{ width: 13, height: 13 }}
                />
              </a>
            </div>
          </div>

          {/* DIVIDER */}
          <div
            className="footer-divider"
            aria-hidden="true"
          />

          {/* ==================================================
              BOTTOM
              ================================================== */}
          <div className="footer-bottom">
            <p className="footer-copyright">
              © {new Date().getFullYear()} Roselanes by Jeev. All rights
              reserved.
            </p>

            <button
              type="button"
              className="footer-top-button"
              onClick={handleTop}
              aria-label="Back to top"
            >
              <span>Back to top</span>
              <ArrowUpRight
                aria-hidden="true"
                style={{ transform: "rotate(-45deg)" }}
              />
            </button>

            <a
              href="https://pixtack.app"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-credit"
              aria-label="Made and managed by Pixtack"
            >
              <span>Made &amp; managed by</span>
              <span className="footer-credit-brand">
                Pixtack hi sonu 
              </span>
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}