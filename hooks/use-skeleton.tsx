"use client";

import { useEffect, useState } from "react";

type UseSkeletonOptions = {
  minimumDuration?: number;
  ready?: boolean;
};

export function useSkeleton({
  minimumDuration = 500,
  ready = true,
}: UseSkeletonOptions = {}) {
  const [assetsReady, setAssetsReady] = useState(false);
  const [minimumTimePassed, setMinimumTimePassed] = useState(false);

  // Minimum time the skeleton stays visible
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMinimumTimePassed(true);
    }, minimumDuration);

    return () => window.clearTimeout(timer);
  }, [minimumDuration]);

  // Wait for initial page assets
  useEffect(() => {
    let cancelled = false;

    const waitForImage = (image: HTMLImageElement) => {
      if (image.complete) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        const finish = () => {
          image.removeEventListener("load", finish);
          image.removeEventListener("error", finish);
          resolve();
        };

        image.addEventListener("load", finish, { once: true });
        image.addEventListener("error", finish, { once: true });
      });
    };

    const waitForAssets = async () => {
      // Wait for document load
      if (document.readyState !== "complete") {
        await new Promise<void>((resolve) => {
          window.addEventListener("load", () => resolve(), {
            once: true,
          });
        });
      }

      // Wait for fonts
      if ("fonts" in document) {
        try {
          await document.fonts.ready;
        } catch {
          // Never block the page because of a font failure
        }
      }

      // Wait for non-lazy images
      const images = Array.from(
        document.querySelectorAll<HTMLImageElement>(
          'img:not([loading="lazy"])',
        ),
      );

      await Promise.all(images.map(waitForImage));

      if (!cancelled) {
        setAssetsReady(true);
      }
    };

    waitForAssets();

    return () => {
      cancelled = true;
    };
  }, []);

  const isReady =
  ready &&
  assetsReady &&
  minimumTimePassed;

return {
  isLoading: !isReady,
  isReady,
};
}