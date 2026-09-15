"use client";

import * as React from "react";
import Image, { type ImageProps } from "next/image";

type ZoomableLightboxImageProps = ImageProps & {
  /** How much to scale the image on zoom-in. Defaults to 2.2x. */
  zoomScale?: number;
};

/**
 * Wraps next/image for use inside a lightbox / full-screen viewer only —
 * NOT meant for grid thumbnails or any image outside a modal.
 *
 * - Click once to zoom in, centered on the click point (shows the native
 *   "zoom-in" cursor — a magnifying glass with a plus).
 * - Click again to zoom back out (cursor switches to "zoom-out").
 * - Zoom resets automatically whenever `src` changes (e.g. navigating to
 *   the next/previous image), so you never get stuck zoomed in on a
 *   different photo.
 *
 * The parent element should have `overflow-hidden` so a zoomed image
 * clips cleanly instead of overlapping the close/nav controls.
 */
export function ZoomableLightboxImage({
  zoomScale = 2.2,
  className = "",
  style,
  src,
  ...imageProps
}: ZoomableLightboxImageProps) {
  const [zoomed, setZoomed] = React.useState(false);
  const [origin, setOrigin] = React.useState("50% 50%");

  // Reset zoom whenever the active image changes.
  React.useEffect(() => {
    setZoomed(false);
    setOrigin("50% 50%");
  }, [src]);

  function handleClick(event: React.MouseEvent<HTMLImageElement>) {
    if (!zoomed) {
      const rect = event.currentTarget.getBoundingClientRect();
      const originX = ((event.clientX - rect.left) / rect.width) * 100;
      const originY = ((event.clientY - rect.top) / rect.height) * 100;
      setOrigin(`${originX}% ${originY}%`);
    }
    setZoomed((current) => !current);
  }

  return (
    <Image
      {...imageProps}
      src={src}
      onClick={handleClick}
      draggable={false}
      className={`${className} touch-none select-none transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] ${
        zoomed ? "cursor-zoom-out" : "cursor-zoom-in"
      }`}
      style={{
        ...style,
        transform: zoomed ? `scale(${zoomScale})` : "scale(1)",
        transformOrigin: origin,
      }}
    />
  );
}

export default ZoomableLightboxImage;