
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const NAV_ITEMS = [
  { label: "Home", href: "#hero" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
] as const;

const HEADER_STYLES = `
  #siteHeader {
    position: fixed;
    top: clamp(12px, 2vh, 18px);
    width: 100%;
    z-index: 1002;
    transition: top 450ms cubic-bezier(.22, 1, .36, 1);
  }

  #siteHeader *,
  #siteHeader *::before,
  #siteHeader *::after {
    box-sizing: border-box;
  }

  #siteHeader .navbar {
    height: 100px;
    width: 100%;
    padding: 0 clamp(20px, 4vw, 64px);

    display: flex;
    align-items: center;
    justify-content: space-between;

    /* Keep the logo and center navigation physically separated
       even when the available width becomes tight. */
    column-gap: clamp(18px, 2vw, 32px);

    overflow: visible;

    transition:
      height 350ms cubic-bezier(.22, 1, .36, 1),
      padding 350ms cubic-bezier(.22, 1, .36, 1);
  }

  #siteHeader .nav-left {
    flex: 1;
    display: flex;
    align-items: center;
    min-width: 0;
    justify-content: center;
  }

  #siteHeader .nav-right {
    flex: 1;
    display: flex;
    align-items: center;
    min-width: 0;
    justify-content: flex-end;
  }

  #siteHeader .nav-center {
    position: relative;
    isolation: isolate;

    flex: 0 0 auto;
    display: flex;
    align-items: center;
    white-space: nowrap;

    padding: 0;

    background: transparent;
    border-radius: 999px;

    transition: padding 350ms cubic-bezier(.22, 1, .36, 1);
  }

  /* ==================================================
     SCROLLED GLASS NAV
     ================================================== */

  #siteHeader .nav-center::before {
    content: "";

    position: absolute;
    inset: 0;
    z-index: -1;

    border-radius: inherit;
    pointer-events: none;

    opacity: 0;

    border: 1px solid rgba(255, 255, 255, .08);

    background:
      linear-gradient(
        180deg,
        rgba(255, 255, 255, .08),
        rgba(255, 255, 255, .03) 45%,
        rgba(255, 255, 255, .01)
      ),
      rgba(52, 12, 24, .42);

    backdrop-filter:
      blur(34px)
      saturate(185%)
      brightness(1.12);

    -webkit-backdrop-filter:
      blur(34px)
      saturate(185%)
      brightness(1.12);

    box-shadow:
      0 18px 50px rgba(0, 0, 0, .22),
      inset 0 1px 1px rgba(255, 255, 255, .45),
      inset 0 -1px 1px rgba(255, 255, 255, .08);

    transition: opacity 350ms cubic-bezier(.22, 1, .36, 1);
    will-change: opacity;
  }

  #siteHeader.scrolled .nav-center::before {
    opacity: 1;
  }

  /* ==================================================
     DESKTOP NAV
     ================================================== */

  #siteHeader .nav-links {
    display: flex;
    align-items: center;
    list-style: none;
    gap: 0;

    margin: 0;
    padding: 0;
  }

  #siteHeader .nav-links a {
    position: relative;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    height: 52px;
    min-width: 80px;

    padding: 0 20px;

    border-radius: 999px;

    color: var(--secondary, #d2b885);
    text-decoration: none;

    font-size: 1rem;
    font-weight: 500;
    letter-spacing: 1.4px;

    transition:
      color 350ms cubic-bezier(.22, 1, .36, 1),
      background 350ms cubic-bezier(.22, 1, .36, 1);
  }

  #siteHeader .nav-links a::before {
    content: "";

    position: absolute;
    inset: 7px 8px;

    border-radius: 999px;

    background: rgba(255, 255, 255, .06);

    opacity: 0;

    pointer-events: none;

    transition: opacity 220ms ease;
  }

  #siteHeader .nav-links a:hover::before {
    opacity: 1;
  }

  #siteHeader .nav-links a::after {
    content: "";

    position: absolute;
    left: 50%;
    bottom: -8px;

    width: 0;
    height: 2px;

    border-radius: 999px;

    background: var(--secondary, #d2b885);

    transform: translateX(-50%);

    transition:
      width 350ms cubic-bezier(.22, 1, .36, 1);
  }

  #siteHeader .nav-links a:hover::after,
  #siteHeader .nav-links a.active::after {
    width: 55%;
  }

  /* ==================================================
     LOGO
     ================================================== */

  #siteHeader .logo {
    min-width: 0;
  }

  #siteHeader .logo a {
  position: relative;
  isolation: isolate;

  display: flex;
  align-items: center;
  min-width: 0;

  padding: 6px 14px;
  border-radius: 32px;

  background: transparent;
}

  #siteHeader .logo a::before {
    content: "";

    position: absolute;
    inset: 0;
    z-index: -1;

    border-radius: inherit;
    pointer-events: none;

    opacity: 0;

    border: 1px solid rgba(255, 255, 255, .08);

    background:
      linear-gradient(
        180deg,
        rgba(255, 255, 255, .08),
        rgba(255, 255, 255, .03) 45%,
        rgba(255, 255, 255, .01)
      ),
      rgba(52, 12, 24, .42);

    backdrop-filter:
      blur(34px)
      saturate(185%)
      brightness(1.12);

    -webkit-backdrop-filter:
      blur(34px)
      saturate(185%)
      brightness(1.12);

    box-shadow:
      0 18px 50px rgba(0, 0, 0, .22),
      inset 0 1px 1px rgba(255, 255, 255, .45),
      inset 0 -1px 1px rgba(255, 255, 255, .08);

    transition: opacity 350ms cubic-bezier(.22, 1, .36, 1);
    will-change: opacity;
  }

  #siteHeader.scrolled .logo a::before {
    opacity: 1;
  }

  #siteHeader .logo img {
    height: 100px;
    width: auto;
    max-width: 280px;
    min-width: 0;
    flex-shrink: 1;

    display: block;
    object-fit: contain;

    transition:
      height 450ms cubic-bezier(.22, 1, .36, 1);
  }

  #siteHeader.scrolled .logo img {
    height: 68px;
  }

  /* ==================================================
     DESKTOP CTA
     ================================================== */

  #siteHeader .nav-right .btn {
    min-width: 170px;
    min-height: 52px;
    height: 52px;
    padding-inline: 30px;
  }

  #siteHeader .header-cta {
    position: relative;
    isolation: isolate;
    overflow: hidden;

    display: inline-flex;
    align-items: center;
    justify-content: center;

    min-width: 170px;
    min-height: 52px;
    height: 52px;
    padding: 0 30px;

    color: var(--primary-darkest, #2b0510);
    text-decoration: none;
    text-transform: uppercase;

    border:
      1px solid
      rgba(210, 184, 133, .45);

    border-radius: 999px;

    background:
      linear-gradient(
        135deg,
        rgba(255, 255, 255, .12),
        rgba(255, 255, 255, .03)
      ),
      var(--secondary, #d2b885);

    font-size: .88rem;
    font-weight: 600;
    letter-spacing: .14em;
    white-space: nowrap;

    box-shadow:
      0 6px 16px rgba(0, 0, 0, .16),
      0 16px 36px rgba(0, 0, 0, .12);

    backdrop-filter:
      blur(28px)
      saturate(180%);

    -webkit-backdrop-filter:
      blur(28px)
      saturate(180%);

    transition:
      transform 280ms cubic-bezier(.22, 1, .36, 1),
      color 280ms ease,
      background 280ms ease,
      border-color 280ms ease,
      box-shadow 280ms ease;
  }

  #siteHeader .header-cta::before {
    content: "";

    position: absolute;
    inset: 0;

    background:
      linear-gradient(
        180deg,
        rgba(255, 255, 255, .24),
        rgba(255, 255, 255, 0) 48%
      );

    opacity: .65;
    pointer-events: none;
    z-index: -1;
  }

  #siteHeader .header-cta::after {
    content: "";

    position: absolute;
    top: -80%;
    left: -120%;

    width: 55%;
    height: 260%;

    background:
      linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, .34),
        transparent
      );

    transform: rotate(18deg);
    transition:
      left 650ms cubic-bezier(.22, 1, .36, 1);

    pointer-events: none;
    z-index: -1;
  }

  #siteHeader .header-cta:hover {
    color: var(--primary-darkest, #2b0510);
    background:
      linear-gradient(
        135deg,
        rgba(255, 255, 255, .16),
        rgba(255, 255, 255, .04)
      ),
      var(--secondary-light, #eeddb8);

    border-color: var(--secondary-light, #eeddb8);

    transform: translateY(-3px);

    box-shadow:
      0 10px 22px rgba(0, 0, 0, .18),
      0 18px 42px rgba(0, 0, 0, .14);
  }

  #siteHeader .header-cta:hover::after {
    left: 150%;
  }

  #siteHeader .header-cta:active {
    transform: translateY(-1px);
  }

  #siteHeader .header-cta:focus,
  #siteHeader .header-cta:focus-visible {
    outline: none;
  }

  /* ==================================================
     MOBILE ELEMENTS — DESKTOP HIDDEN
     ================================================== */

  #siteHeader .menu-btn,
  #siteHeader .nav-overlay,
  #siteHeader .mobile-nav {
    display: none;
  }

  /* ==================================================
     TABLET
     ================================================== */

  @media (max-width: 1100px) {
    #siteHeader .navbar {
      padding: 0 28px;
      column-gap: 18px;
    }

    #siteHeader .logo img {
      height: 84px;
      max-width: 260px;
    }

    #siteHeader.scrolled .logo img {
      height: 60px;
    }

    #siteHeader .nav-links a {
      min-width: auto;
      padding: 0 10px;
      font-size: .88rem;
      letter-spacing: .04em;
    }

    #siteHeader .nav-right .btn,
    #siteHeader .header-cta {
      min-width: 140px;
      min-height: 52px;
      height: 52px;
      padding-inline: 22px;
      font-size: .82rem;
    }
  }

  /* ==================================================
     MOBILE
     ================================================== */

  @media (max-width: 860px) {
    #siteHeader {
      top: clamp(8px, 1.2vh, 12px);
    }

    #siteHeader .navbar {
      position: relative;
      height: 60px;
      padding: 0 14px 0 18px;
    }

    #siteHeader .nav-center,
    #siteHeader .nav-right {
      display: none;
    }

    #siteHeader .nav-left {
      flex: 1;
    }

    /* ==================================================
       MOBILE LOGO
       ================================================== */

    #siteHeader .logo {
      position: absolute;

      top: 50%;
      left: 50%;

      transform: translate(-50%, -50%);
    }

    #siteHeader .logo img {
      height: 64px;
      max-width: 220px;
    }

    #siteHeader.scrolled .logo img {
      height: 56px;
    }

    #siteHeader.nav-is-open .logo {
      visibility: hidden;
      pointer-events: none;
    }

    /* ==================================================
       MOBILE MENU BUTTON
       ================================================== */

    #siteHeader .menu-btn {
      position: absolute;

      top: 50%;
      right: 14px;

      transform: translateY(-50%);

      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      gap: 5px;

      width: 44px;
      height: 44px;

      padding: 0;
      box-sizing: border-box;

      appearance: none;
      -webkit-appearance: none;

      border:
        1px solid
        rgba(210, 184, 133, .38);

      border-radius: 50%;

      background: var(--primary-darkest, #2b0510);
      color: var(--secondary, #d2b885);

      cursor: pointer;

      -webkit-tap-highlight-color: transparent;

      box-shadow:
        0 5px 14px rgba(0, 0, 0, .24),
        inset 0 1px 0 rgba(255, 255, 255, .08);

      z-index: 1004;

      transition:
        transform 220ms cubic-bezier(.22, 1, .36, 1),
        opacity 180ms ease,
        visibility 0s linear 180ms,
        background 220ms ease,
        border-color 220ms ease,
        box-shadow 220ms ease;
    }

    #siteHeader .menu-btn:focus,
    #siteHeader .menu-btn:focus-visible {
      outline: none;

      box-shadow:
        0 5px 14px rgba(0, 0, 0, .24),
        inset 0 1px 0 rgba(255, 255, 255, .08);
    }

    #siteHeader .menu-btn:hover {
      background: var(--primary-dark, #5c0c24);

      border-color:
        rgba(210, 184, 133, .58);

      transform:
        translateY(-50%)
        scale(1.025);

      box-shadow:
        0 7px 18px rgba(0, 0, 0, .28),
        inset 0 1px 0 rgba(255, 255, 255, .10);
    }

    #siteHeader .menu-btn:active {
      transform:
        translateY(-50%)
        scale(.96);

      background:
        var(--primary-darkest, #2b0510);

      box-shadow:
        0 3px 8px rgba(0, 0, 0, .25),
        inset 0 1px 2px rgba(0, 0, 0, .18);
    }

    #siteHeader.nav-is-open .menu-btn {
      opacity: 0;
      visibility: hidden;
      pointer-events: none;

      transform:
        translateY(-50%)
        scale(.92);

      transition:
        opacity 140ms ease-out,
        transform 180ms ease-out,
        visibility 0s linear 180ms;
    }

    #siteHeader .menu-line {
      display: block;

      width: 17px;
      height: 1.5px;
      flex: 0 0 1.5px;

      background: var(--secondary, #d2b885);

      border-radius: 999px;

      transform-origin: center;

      transition:
        transform 280ms cubic-bezier(.22, 1, .36, 1),
        opacity 180ms ease,
        width 220ms ease;
    }

    /* ==================================================
       OVERLAY
       ================================================== */

    #siteHeader .nav-overlay {
      display: block;

      position: fixed;
      inset: 0;

      background: rgba(0, 0, 0, .45);

      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);

      opacity: 0;
      visibility: hidden;
      pointer-events: none;

      z-index: 1000;

      transition:
        opacity 350ms cubic-bezier(.22, 1, .36, 1),
        visibility 0s linear 350ms;
    }

    #siteHeader.nav-is-open .nav-overlay {
      opacity: 1;
      visibility: visible;
      pointer-events: auto;

      transition:
        opacity 350ms cubic-bezier(.22, 1, .36, 1),
        visibility 0s linear 0s;
    }

    /* ==================================================
       MOBILE DRAWER
       ================================================== */

    #siteHeader .mobile-nav {
      display: flex;
      flex-direction: column;

      position: fixed;

      top: 0;
      right: 0;

      width: min(280px, 80vw);
      height: 100dvh;
        overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;

      box-sizing: border-box;

      padding:
        100px
        24px
        24px;

      background:
        linear-gradient(
          180deg,
          rgba(255, 255, 255, .08),
          rgba(255, 255, 255, .03) 45%,
          rgba(255, 255, 255, .01)
        ),
        rgba(52, 12, 24, .42);

      backdrop-filter:
        blur(24px)
        saturate(180%);

      -webkit-backdrop-filter:
        blur(24px)
        saturate(180%);

      border-left:
        1px solid
        rgba(255, 255, 255, .08);

      border-top-left-radius: 28px;
      border-bottom-left-radius: 28px;

      box-shadow:
        -18px 0 50px rgba(0, 0, 0, .18),
        inset 1px 0 1px rgba(255, 255, 255, .06);

      visibility: hidden;
      pointer-events: none;

      transform: translateX(100%);

      z-index: 1003;

      transition:
        transform 350ms cubic-bezier(.22, 1, .36, 1),
        visibility 0s linear 350ms;
    }

    #siteHeader.nav-is-open .mobile-nav {
      visibility: visible;
      pointer-events: auto;

      transform: translateX(0);

      transition:
        transform 350ms cubic-bezier(.22, 1, .36, 1),
        visibility 0s linear 0s;
    }

    /* ==================================================
       CLOSE ROW
       ================================================== */

    #siteHeader .mobile-nav-close-row {
      position: absolute;

      top: 24px;
      right: 20px;

      display: flex;
      align-items: center;
      justify-content: center;
    }

    #siteHeader .mobile-nav-close {
      display: flex;

      align-items: center;
      justify-content: center;

      width: 36px;
      height: 36px;

      padding: 0;
      box-sizing: border-box;

      appearance: none;
      -webkit-appearance: none;

      border:
        1px solid
        rgba(210, 184, 133, .38);

      border-radius: 50%;

      background:
        var(--primary-darkest, #2b0510);

      color:
        var(--secondary, #d2b885);

      cursor: pointer;

      -webkit-tap-highlight-color: transparent;

      box-shadow:
        0 5px 14px rgba(0, 0, 0, .24),
        inset 0 1px 0 rgba(255, 255, 255, .08);

      transition:
        transform 260ms cubic-bezier(.22, 1, .36, 1),
        background 220ms ease,
        border-color 220ms ease,
        box-shadow 220ms ease;
    }

    #siteHeader .mobile-nav-close:focus,
    #siteHeader .mobile-nav-close:focus-visible {
      outline: none;

      box-shadow:
        0 5px 14px rgba(0, 0, 0, .24),
        inset 0 1px 0 rgba(255, 255, 255, .08);
    }

    #siteHeader .mobile-nav-close:hover {
      background:
        var(--primary-dark, #5c0c24);


      border-color:
        rgba(210, 184, 133, .58);

      transform:
        rotate(90deg)
        scale(1.025);

      box-shadow:
        0 7px 18px rgba(0, 0, 0, .28),
        inset 0 1px 0 rgba(255, 255, 255, .10);
    }

    #siteHeader .mobile-nav-close:active {
      transform:
        rotate(90deg)
        scale(.94);

      background:
        var(--primary-darkest, #2b0510);

      box-shadow:
        0 3px 8px rgba(0, 0, 0, .25),
        inset 0 1px 2px rgba(0, 0, 0, .18);
    }

    #siteHeader .close-icon {
      position: relative;

      display: block;

      width: 14px;
      height: 14px;
    }

    #siteHeader .close-icon span {
      position: absolute;

      top: 50%;
      left: 50%;

      display: block;

      width: 16px;
      height: 1.5px;

      border-radius: 999px;

      background:
        var(--secondary, #d2b885);

      transform-origin: center;
    }

    #siteHeader .close-icon span:first-child {
      transform:
        translate(-50%, -50%)
        rotate(45deg);
    }

    #siteHeader .close-icon span:last-child {
      transform:
        translate(-50%, -50%)
        rotate(-45deg);
    }

    /* ==================================================
       MOBILE LINK LIST
       ================================================== */

    #siteHeader .mobile-nav-links {
      display: flex;
      flex-direction: column;

      gap: 0;

      width: 100%;

      margin: 0;
      padding: 0;

      list-style: none;
    }

    #siteHeader .mobile-nav-links li {
      width: 100%;
    }

    #siteHeader .mobile-nav-links a {
      display: flex;

      align-items: center;

      width: 100%;

      min-height: 52px;

      box-sizing: border-box;

      padding:
        14px 4px;

      color:
        var(--secondary, #d2b885);

      text-decoration: none;

      font-size: 1.1rem;
      font-weight: 500;
      letter-spacing: .01em;

      border-bottom:
        1px solid
        color-mix(
          in srgb,
          var(--secondary, #d2b885) 22%,
          transparent
        );

      transition:
        color 350ms cubic-bezier(.22, 1, .36, 1),
        background 350ms cubic-bezier(.22, 1, .36, 1),
        padding-left 350ms cubic-bezier(.22, 1, .36, 1);
    }

    #siteHeader .mobile-nav-links a:hover {
      color:
        var(--secondary-light, #eeddb8);

      padding-left: 8px;
    }

    /* ==================================================
       MOBILE CTA
       ================================================== */

    #siteHeader .mobile-nav-cta {
      width: 100%;

      min-width: 0;

      min-height: 54px;
      height: 54px;

      margin-top: 24px;

      padding: 0 20px;

      display: flex;
      align-items: center;
      justify-content: center;

      box-sizing: border-box;

      color:
        var(--primary-darkest, #2b0510);

      text-decoration: none;
      text-transform: uppercase;

      border:
        1px solid
        rgba(210, 184, 133, .45);

      border-radius: 999px;

      background:
        var(--secondary, #d2b885);

      font-size: .88rem;
      font-weight: 600;
      letter-spacing: .14em;

      box-shadow:
        0 8px 24px rgba(0, 0, 0, .16);

      flex-shrink: 0;

      transition:
        background 220ms ease,
        transform 220ms ease;
    }

    #siteHeader .mobile-nav-cta:hover {
      color:
        var(--primary-darkest, #2b0510);

      background:
        var(--secondary-light, #eeddb8);
    }
  }

  /* ==================================================
     VERY SMALL MOBILE
     ================================================== */

  @media (max-width: 400px) {
    #siteHeader .navbar {
      padding:
        0 10px 0 14px;
    }

    #siteHeader .logo img {
      height: 56px;
      max-width: 190px;
    }

    #siteHeader.scrolled .logo img {
      height: 48px;
    }

    #siteHeader .menu-btn {
      right: 10px;

      width: 38px;
      height: 38px;

      gap: 4px;
    }

    #siteHeader .menu-line {
      width: 15px;
    }

    #siteHeader .mobile-nav {
      width: min(300px, 86vw);

      padding:
        88px
        20px
        20px;
    }

    #siteHeader .mobile-nav-close {
      width: 32px;
      height: 32px;
    }

    #siteHeader .mobile-nav-close-row {
      top: 20px;
      right: 16px;
    }

    #siteHeader .mobile-nav-links a {
      font-size: 1rem;

      min-height: 50px;

      padding:
        13px 4px;
    }

    #siteHeader .mobile-nav-cta {
      min-height: 52px;
      height: 52px;

      margin-top: 20px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    #siteHeader *,
    #siteHeader *::before,
    #siteHeader *::after {
      scroll-behavior: auto !important;
    }
  }
`;

export default function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");

  const headerRef = useRef<HTMLElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);

  const touchStartX = useRef<number | null>(null);
  const touchCurrentX = useRef<number | null>(null);

  const scrollRaf = useRef<number | null>(null);

  const updateHeaderLayout = useCallback(() => {
    const header = headerRef.current;

    if (!header) {
      return;
    }

    const rect = header.getBoundingClientRect();

    document.documentElement.style.setProperty(
      "--header-height",
      `${rect.height}px`,
    );

    document.documentElement.style.setProperty(
      "--header-offset",
      `${rect.top}px`,
    );
  }, []);

  const updateNavbar = useCallback(() => {
    setIsScrolled(Math.max(window.scrollY, 0) > 40);
  }, []);

  const closeMenu = useCallback((restoreFocus = true) => {
    setIsOpen(false);

    if (restoreFocus) {
      window.setTimeout(() => {
        menuButtonRef.current?.focus();
      }, 0);
    }
  }, []);

  const openMenu = useCallback(() => {
    setIsOpen(true);

    window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);
  }, []);

  const scrollToHash = useCallback(
    (href: string) => {
      const id = href.slice(1);
      const target = document.getElementById(id);

      if (!target) {
        return;
      }

      /*
       * Each section owns the full header clearance as TOP PADDING:
       * header top offset + actual header height.
       *
       * Therefore the section itself should land at viewport top.
       * Do NOT subtract the header height here, otherwise the header
       * clearance gets counted twice and an extra gap appears.
       */
      const targetTop =
        target.getBoundingClientRect().top +
        window.scrollY;

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      window.scrollTo({
        top: Math.max(targetTop, 0),
        behavior: reducedMotion ? "auto" : "smooth",
      });
    },
    [],
  );

  /*
   * Header layout
   *
   * Matches the original JS:
   * --header-height
   * --header-offset
   * ResizeObserver + resize listener.
   */
  useEffect(() => {
    const header = headerRef.current;

    if (!header) {
      return;
    }

    updateHeaderLayout();

    let observer: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(updateHeaderLayout);
      observer.observe(header);
    }

    window.addEventListener("resize", updateHeaderLayout);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateHeaderLayout);
    };
  }, [updateHeaderLayout]);

  /*
   * Scroll state
   *
   * Original behavior:
   * transparent at the top,
   * glass state after 40px.
   */
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRaf.current !== null) {
        return;
      }

      scrollRaf.current = window.requestAnimationFrame(() => {
        updateNavbar();
        scrollRaf.current = null;
      });
    };

    updateNavbar();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);

      if (scrollRaf.current !== null) {
        window.cancelAnimationFrame(scrollRaf.current);
        scrollRaf.current = null;
      }
    };
  }, [updateNavbar]);

  /*
   * Body locking while mobile navigation is open.
   *
   * The original CSS uses body.nav-open.
   * We additionally preserve/restore the existing inline overflow
   * so this component does not permanently modify page scrolling.
   */
useEffect(() => {
  if (!isOpen) return;

  const body = document.body;
  const scrollY = window.scrollY;

  const previousPosition = body.style.position;
  const previousTop = body.style.top;
  const previousWidth = body.style.width;
  const previousOverflow = body.style.overflow;

  body.classList.add("nav-open");

  body.style.position = "fixed";
  body.style.top = `-${scrollY}px`;
  body.style.width = "100%";
  body.style.overflow = "hidden";

  return () => {
    body.classList.remove("nav-open");

    body.style.position = previousPosition;
    body.style.top = previousTop;
    body.style.width = previousWidth;
    body.style.overflow = previousOverflow;

    window.scrollTo(0, scrollY);
  };
}, [isOpen]);

  /*
   * Keep the original visual state tied to the component itself.
   */
  useEffect(() => {
    const header = headerRef.current;

    if (!header) {
      return;
    }

    header.classList.toggle("scrolled", isScrolled);
    header.classList.toggle("nav-is-open", isOpen);
  }, [isScrolled, isOpen]);

  /*
   * Escape closes the drawer.
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const drawer = drawerRef.current;

      if (!drawer) {
        return;
      }

      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        ),
      ).filter((element) => {
        const style = window.getComputedStyle(element);

        return (
          style.visibility !== "hidden" &&
          style.display !== "none"
        );
      });

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeMenu]);

  /*
   * Mobile swipe-to-close.
   *
   * Original threshold: 60px.
   */
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const drawer = drawerRef.current;

    if (!drawer) {
      return;
    }

    const handleTouchStart = (event: TouchEvent) => {
      touchStartX.current = event.touches[0]?.clientX ?? null;
      touchCurrentX.current = touchStartX.current;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (
        touchStartX.current === null ||
        event.touches[0] === undefined
      ) {
        return;
      }

      touchCurrentX.current = event.touches[0].clientX;

      const delta =
        touchCurrentX.current - touchStartX.current;

      if (delta > 0) {
        drawer.style.transition = "none";
        drawer.style.transform = `translateX(${delta}px)`;
      }
    };

    const handleTouchEnd = () => {
      if (
        touchStartX.current === null ||
        touchCurrentX.current === null
      ) {
        return;
      }

      const delta =
        touchCurrentX.current - touchStartX.current;

      drawer.style.transition = "";

      if (delta > 60) {
        closeMenu(false);
      } else {
        drawer.style.transform = "";
      }

      touchStartX.current = null;
      touchCurrentX.current = null;
    };

    drawer.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });

    drawer.addEventListener("touchmove", handleTouchMove, {
      passive: true,
    });

    drawer.addEventListener("touchend", handleTouchEnd, {
      passive: true,
    });

    return () => {
      drawer.removeEventListener(
        "touchstart",
        handleTouchStart,
      );

      drawer.removeEventListener(
        "touchmove",
        handleTouchMove,
      );

      drawer.removeEventListener(
        "touchend",
        handleTouchEnd,
      );

      drawer.style.transition = "";
      drawer.style.transform = "";
    };
  }, [isOpen, closeMenu]);

  /*
   * Active navigation section.
   *
   * Exact original observer thresholds and rootMargin.
   */
  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("section[id]"),
    );

    if (sections.length === 0) {
      return;
    }

    const sectionRatios = new Map<string, number>();

    sections.forEach((section) => {
      sectionRatios.set(section.id, 0);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).id;

          sectionRatios.set(
            id,
            entry.isIntersecting
              ? entry.intersectionRatio
              : 0,
          );
        });

        let currentId: string | null = null;
        let maxRatio = 0;

        sectionRatios.forEach((ratio, id) => {
          if (ratio > maxRatio) {
            maxRatio = ratio;
            currentId = id;
          }
        });

        if (!currentId) {
          return;
        }

        setActiveSection(currentId);
      },
      {
        threshold: [0, 0.25, 0.45, 0.75, 1],
        rootMargin: "-20% 0px -40% 0px",
      },
    );

    sections.forEach((section) => {
      observer.observe(section);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleNavigation = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (!href.startsWith("#")) {
      return;
    }

    event.preventDefault();

    if (isOpen) {
      closeMenu(false);
    }

    scrollToHash(href);
  };

  return (
    <>
      <style>{HEADER_STYLES}</style>

      <header
        id="siteHeader"
        ref={headerRef}
      >
        <nav
          className="navbar"
          aria-label="Primary navigation"
        >
          {/* LOGO */}
          <div className="nav-left">
            <div className="logo">
              <a
                href="#hero"
                aria-label="Roselanes home"
                onClick={(event) =>
                  handleNavigation(event, "#hero")
                }
              >
                <img
                  src="/brand/logo.svg"
                  alt="/brand/logo.png"
                />
              </a>
            </div>
          </div>

          {/* DESKTOP NAVIGATION */}
          <div className="nav-center">
            <ul className="nav-links">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className={
                      activeSection === item.href.slice(1)
                        ? "active"
                        : ""
                    }
                    onClick={(event) =>
                      handleNavigation(
                        event,
                        item.href,
                      )
                    }
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* DESKTOP CTA */}
          <div className="nav-right">
            <a
              href="/quote"
              className="header-cta btn btn-primary"
            >
              Get a Quote
            </a>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            ref={menuButtonRef}
            id="menuButton"
            className="menu-btn"
            type="button"
            aria-label={
              isOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={isOpen}
            aria-controls="mobileNavigation"
            onClick={() => {
              if (isOpen) {
                closeMenu();
              } else {
                openMenu();
              }
            }}
          >
            <span className="menu-line" />
            <span className="menu-line" />
            <span className="menu-line" />
          </button>

          {/* MOBILE NAVIGATION OVERLAY */}
          <div
            className="nav-overlay"
            aria-hidden={!isOpen}
            onClick={() => closeMenu(false)}
          />

          {/* MOBILE NAVIGATION DRAWER */}
          <aside
            ref={drawerRef}
            id="mobileNavigation"
            className="mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            aria-hidden={!isOpen}
          >
            {/* CLOSE BUTTON */}
            <div className="mobile-nav-close-row">
              <button
                ref={closeButtonRef}
                type="button"
                className="mobile-nav-close"
                aria-label="Close navigation menu"
                onClick={() => closeMenu()}
              >
                <span
                  className="close-icon"
                  aria-hidden="true"
                >
                  <span />
                  <span />
                </span>
              </button>
            </div>

            {/* MOBILE LINKS */}
            <ul className="mobile-nav-links">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={(event) =>
                      handleNavigation(
                        event,
                        item.href,
                      )
                    }
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            {/* MOBILE CTA */}
            <a
              href="/quote"
              className="mobile-nav-cta btn btn-primary"
              onClick={() => closeMenu(false)}
            >
              Get a Quote
            </a>
          </aside>
        </nav>
      </header>
    </>
  );
}