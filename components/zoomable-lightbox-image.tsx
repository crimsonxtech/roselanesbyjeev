"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";

type ZoomableLightboxImageProps = ImageProps & {
  /** How much to scale the image on zoom-in. Defaults to 2.2x. */
  zoomScale?: number;
  /**
   * Called when the user swipes toward the previous image — either a
   * plain swipe-right while not zoomed, or dragging past the left edge
   * while zoomed in (same behavior as the native iOS/Android photo
   * gallery).
   */
  onSwipePrev?: () => void;
  /** Called when the user swipes toward the next image. See onSwipePrev. */
  onSwipeNext?: () => void;
};

// Minimum finger movement before a tap is reclassified as a drag.
const DRAG_THRESHOLD = 6;
// How far (px) you must swipe while NOT zoomed to trigger next/prev.
const SWIPE_THRESHOLD = 50;
// How far (px) past the pan edge you must drag while zoomed in to
// trigger next/prev, same as reaching the edge of a photo in a native
// gallery app and continuing to swipe.
const EDGE_SWIPE_THRESHOLD = 60;
// Visual "give" applied once you've dragged past the pannable edge, so
// it doesn't feel like a hard wall before the swipe kicks in.
const RUBBER_BAND_FACTOR = 0.3;

type Vec2 = { x: number; y: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Wraps next/image for use inside a lightbox / full-screen viewer only —
 * NOT meant for grid thumbnails or any image outside a modal.
 *
 * - Tap once to zoom in, centered on the tap point (shows the native
 *   "zoom-in" cursor on desktop — a magnifying glass with a plus).
 * - Tap again to zoom back out (cursor switches to "zoom-out").
 * - While zoomed in, drag/swipe to pan around the image to see other
 *   corners/edges.
 * - Swipe left/right to go to the next/previous image. This also works
 *   while zoomed in: once you've panned as far as you can in a
 *   direction, continuing to swipe that way moves to the next/previous
 *   image — just like a native phone photo gallery.
 * - Zoom and pan reset automatically whenever `src` changes (e.g.
 *   navigating to the next/previous image), so you never get stuck
 *   zoomed in on a different photo.
 *
 * The parent element should have `overflow-hidden` so a zoomed/panned
 * image clips cleanly instead of overlapping the close/nav controls.
 */
export function ZoomableLightboxImage({
  zoomScale = 2.2,
  className = "",
  style,
  src,
  onSwipePrev,
  onSwipeNext,
  ...imageProps
}: ZoomableLightboxImageProps) {
  const [zoomed, setZoomed] = React.useState(false);
  const [translate, setTranslate] = React.useState<Vec2>({ x: 0, y: 0 });
  // Only used for the CSS transition — we disable it mid-drag so panning
  // tracks the finger 1:1, and re-enable it for the settle/zoom snap.
  const [isAnimating, setIsAnimating] = React.useState(false);

  const imgRef = React.useRef<HTMLImageElement | null>(null);

  const pointerIdRef = React.useRef<number | null>(null);
  const startPointRef = React.useRef<Vec2>({ x: 0, y: 0 });
  const startTranslateRef = React.useRef<Vec2>({ x: 0, y: 0 });
  const draggedRef = React.useRef(false);
  const overshootRef = React.useRef<Vec2>({ x: 0, y: 0 });

  // Pan bounds for the current zoom-in, captured once when zooming in
  // (the rendered image size doesn't change afterwards, only its
  // transform does, so this only needs recomputing on each zoom-in).
  const boundsRef = React.useRef<Vec2>({ x: 0, y: 0 });

  // Reset zoom/pan whenever the active image changes.
  React.useEffect(() => {
    setZoomed(false);
    setTranslate({ x: 0, y: 0 });
    setIsAnimating(false);
  }, [src]);

  const computeBounds = React.useCallback((): Vec2 => {
    const img = imgRef.current;
    const container = img?.parentElement;

    if (!img || !container) return { x: 0, y: 0 };

    // Measured while unscaled (called right as we zoom in, before the
    // transform is applied for this interaction).
    const baseRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const maxX = Math.max(
      0,
      (baseRect.width * zoomScale - containerRect.width) / 2,
    );
    const maxY = Math.max(
      0,
      (baseRect.height * zoomScale - containerRect.height) / 2,
    );

    return { x: maxX, y: maxY };
  }, [zoomScale]);

  const zoomIn = React.useCallback(
    (clientX: number, clientY: number) => {
      const img = imgRef.current;
      if (!img) return;

      const rect = img.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Offset of the tap point from the image's own center, in
      // unscaled px — keeps that point fixed under the finger as we
      // scale up. Derivation: translate = offset * (1 - scale).
      const offsetX = clientX - centerX;
      const offsetY = clientY - centerY;

      const bounds = computeBounds();
      boundsRef.current = bounds;

      const rawX = offsetX * (1 - zoomScale);
      const rawY = offsetY * (1 - zoomScale);

      setIsAnimating(true);
      setZoomed(true);
      setTranslate({
        x: clamp(rawX, -bounds.x, bounds.x),
        y: clamp(rawY, -bounds.y, bounds.y),
      });
    },
    [computeBounds, zoomScale],
  );

  const zoomOut = React.useCallback(() => {
    setIsAnimating(true);
    setZoomed(false);
    setTranslate({ x: 0, y: 0 });
  }, []);

  function handlePointerDown(event: React.PointerEvent<HTMLImageElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    pointerIdRef.current = event.pointerId;
    startPointRef.current = { x: event.clientX, y: event.clientY };
    startTranslateRef.current = translate;
    draggedRef.current = false;
    overshootRef.current = { x: 0, y: 0 };
    setIsAnimating(false);

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLImageElement>) {
    if (pointerIdRef.current !== event.pointerId) return;

    const dx = event.clientX - startPointRef.current.x;
    const dy = event.clientY - startPointRef.current.y;

    if (
      !draggedRef.current &&
      Math.hypot(dx, dy) < DRAG_THRESHOLD
    ) {
      return;
    }

    draggedRef.current = true;
    event.preventDefault();

    if (!zoomed) {
      // Not zoomed: only horizontal movement matters, used purely to
      // detect a swipe gesture. No live transform needed here — the
      // image stays put until we decide to navigate on release.
      return;
    }

    const bounds = boundsRef.current;
    const rawX = startTranslateRef.current.x + dx;
    const rawY = startTranslateRef.current.y + dy;

    const clampedX = clamp(rawX, -bounds.x, bounds.x);
    const clampedY = clamp(rawY, -bounds.y, bounds.y);

    const overshootX = rawX - clampedX;
    const overshootY = rawY - clampedY;
    overshootRef.current = { x: overshootX, y: overshootY };

    setTranslate({
      x: clampedX + overshootX * RUBBER_BAND_FACTOR,
      y: clampedY + overshootY * RUBBER_BAND_FACTOR,
    });
  }

  function handlePointerUp(event: React.PointerEvent<HTMLImageElement>) {
    if (pointerIdRef.current !== event.pointerId) return;

    pointerIdRef.current = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const dx = event.clientX - startPointRef.current.x;

    if (!draggedRef.current) {
      // Plain tap: toggle zoom centered on the tap point.
      if (zoomed) {
        zoomOut();
      } else {
        zoomIn(event.clientX, event.clientY);
      }
      return;
    }

    if (!zoomed) {
      // Not zoomed: a horizontal drag is a swipe to the next/prev image.
      if (dx > SWIPE_THRESHOLD) {
        onSwipePrev?.();
      } else if (dx < -SWIPE_THRESHOLD) {
        onSwipeNext?.();
      }
      return;
    }

    // Zoomed: if we dragged past the pan bounds far enough, treat it as
    // a swipe to the next/prev image, same as a native gallery.
    const overshootX = overshootRef.current.x;

    if (overshootX > EDGE_SWIPE_THRESHOLD) {
      onSwipePrev?.();
      return;
    }

    if (overshootX < -EDGE_SWIPE_THRESHOLD) {
      onSwipeNext?.();
      return;
    }

    // Otherwise, settle back within the pannable bounds.
    const bounds = boundsRef.current;
    setIsAnimating(true);
    setTranslate((current) => ({
      x: clamp(current.x, -bounds.x, bounds.x),
      y: clamp(current.y, -bounds.y, bounds.y),
    }));
  }

  return (
    <Image
      {...imageProps}
      ref={imgRef}
      src={src}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      draggable={false}
      className={`${className} touch-none select-none ${
        isAnimating
          ? "transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)]"
          : ""
      } ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
      style={{
        ...style,
        transform: `translate3d(${translate.x}px, ${translate.y}px, 0) scale(${
          zoomed ? zoomScale : 1
        })`,
        transformOrigin: "50% 50%",
      }}
    />
  );
}

export default ZoomableLightboxImage;