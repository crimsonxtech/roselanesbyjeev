"use client";

import type { ReactNode } from "react";
import { useSkeleton } from "@/hooks/use-skeleton";

type PageSkeletonProps = {
  children: ReactNode;
};

export function PageSkeleton({ children }: PageSkeletonProps) {
  const { isLoading } = useSkeleton({
    minimumDuration: 500,
  });

  return (
    <div className="relative min-h-screen">
      <div
        data-skeleton-screen
        className={isLoading ? "" : "is-ready"}
        aria-hidden={!isLoading}
      >
        <div className="min-h-screen overflow-hidden">
          <PageSkeletonContent />
        </div>
      </div>

      <div
        data-skeleton-content
        className={isLoading ? "" : "is-ready"}
      >
        {children}
      </div>
    </div>
  );
}

function PageSkeletonContent() {
  return (
    <div
      aria-hidden="true"
      className="min-h-screen overflow-hidden"
    >
      {/* =====================================================
          HEADER
          ===================================================== */}
      <header className="fixed inset-x-0 top-0 z-50 px-5 py-5 sm:px-8 lg:px-10">
        <div className="mx-auto flex items-center justify-between">
          <SkeletonBlock className="h-9 w-32 rounded-md" />

          <div className="hidden items-center gap-6 md:flex">
            <SkeletonBlock className="h-3 w-14 rounded-full" />
            <SkeletonBlock className="h-3 w-16 rounded-full" />
            <SkeletonBlock className="h-3 w-14 rounded-full" />
            <SkeletonBlock className="h-3 w-12 rounded-full" />
          </div>

          <SkeletonBlock className="h-9 w-9 rounded-full md:hidden" />
        </div>
      </header>

      <main className="relative z-[1]">
        {/* =====================================================
            HERO
            ===================================================== */}
        <section className="relative min-h-screen px-5 pb-16 pt-28 sm:px-8 lg:px-12">
          <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-[1500px] items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
            <div className="order-2 space-y-7 lg:order-1">
              <SkeletonBlock className="h-3 w-28 rounded-full" />

              <div className="space-y-3">
                <SkeletonBlock className="h-12 w-[88%] rounded-md sm:h-16" />
                <SkeletonBlock className="h-12 w-[72%] rounded-md sm:h-16" />
              </div>

              <SkeletonBlock className="h-4 w-[75%] rounded-full" />
              <SkeletonBlock className="h-4 w-[58%] rounded-full" />

              <div className="flex flex-wrap gap-3 pt-3">
                <SkeletonBlock className="h-11 w-36 rounded-full" />
                <SkeletonBlock className="h-11 w-32 rounded-full" />
              </div>

              <div className="grid max-w-lg grid-cols-3 gap-5 pt-8">
                <SkeletonMetric />
                <SkeletonMetric />
                <SkeletonMetric />
              </div>
            </div>

            <div className="order-1 relative min-h-[420px] sm:min-h-[520px] lg:order-2 lg:min-h-[620px]">
              <SkeletonBlock className="absolute right-0 top-0 h-[72%] w-[68%] rounded-[24px]" />
              <SkeletonBlock className="absolute bottom-0 left-0 h-[54%] w-[43%] rounded-[20px]" />
              <SkeletonBlock className="absolute bottom-[12%] right-[7%] h-[35%] w-[31%] rounded-[18px]" />
            </div>
          </div>
        </section>

        {/* =====================================================
            PORTFOLIO
            ===================================================== */}
        <section className="px-5 py-24 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1500px]">
            <SkeletonHeading width="portfolio" />

            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              <SkeletonBlock className="aspect-[4/5] w-full rounded-[18px]" />
              <SkeletonBlock className="aspect-[4/5] w-full rounded-[18px]" />
              <SkeletonBlock className="aspect-[4/5] w-full rounded-[18px]" />
              <SkeletonBlock className="aspect-[4/5] w-full rounded-[18px]" />
            </div>
          </div>
        </section>

        {/* =====================================================
            QUOTE
            ===================================================== */}
        <section className="px-5 py-24 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1500px]">
            <SkeletonHeading width="quote" />

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[22px] border border-white/[0.06] p-6 sm:p-8">
                <div className="space-y-7">
                  <SkeletonBlock className="h-4 w-32 rounded-full" />

                  <div className="grid gap-5 sm:grid-cols-2">
                    <SkeletonField />
                    <SkeletonField />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <SkeletonField />
                    <SkeletonField />
                  </div>

                  <SkeletonBlock className="h-28 w-full rounded-xl" />
                </div>
              </div>

              <div className="rounded-[22px] border border-white/[0.06] p-6 sm:p-8">
                <div className="space-y-6">
                  <SkeletonBlock className="h-4 w-36 rounded-full" />
                  <SkeletonBlock className="h-20 w-full rounded-xl" />
                  <SkeletonBlock className="h-20 w-full rounded-xl" />
                  <SkeletonBlock className="h-20 w-full rounded-xl" />

                  <div className="flex justify-end pt-3">
                    <SkeletonBlock className="h-11 w-40 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            TESTIMONIALS
            ===================================================== */}
        <section className="px-5 py-24 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1500px]">
            <SkeletonHeading width="testimonials" />

            <div className="grid gap-5 md:grid-cols-3">
              <SkeletonTestimonial />
              <SkeletonTestimonial />
              <SkeletonTestimonial />
            </div>
          </div>
        </section>

        {/* =====================================================
            ABOUT
            ===================================================== */}
        <section className="px-5 py-24 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1500px]">
            <SkeletonHeading width="about" />

            <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
              <SkeletonBlock className="min-h-[360px] rounded-[22px] sm:min-h-[480px]" />

              <div className="flex flex-col justify-center space-y-5">
                <SkeletonBlock className="h-4 w-28 rounded-full" />

                <div className="space-y-3">
                  <SkeletonBlock className="h-8 w-full rounded-md" />
                  <SkeletonBlock className="h-8 w-[88%] rounded-md" />
                  <SkeletonBlock className="h-8 w-[72%] rounded-md" />
                </div>

                <div className="space-y-3 pt-2">
                  <SkeletonBlock className="h-3.5 w-full rounded-full" />
                  <SkeletonBlock className="h-3.5 w-[94%] rounded-full" />
                  <SkeletonBlock className="h-3.5 w-[82%] rounded-full" />
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-3">
              <SkeletonInfoCard />
              <SkeletonInfoCard />
              <SkeletonInfoCard />
            </div>
          </div>
        </section>

        {/* =====================================================
            CONTACT
            ===================================================== */}
        <section className="px-5 py-24 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-[1500px]">
            <SkeletonHeading width="contact" />

            <div className="grid gap-6 lg:grid-cols-[.75fr_1.25fr]">
              <div className="space-y-4">
                <SkeletonContactCard />
                <SkeletonContactCard />
                <SkeletonContactCard />
              </div>

              <div className="rounded-[22px] border border-white/[0.06] p-6 sm:p-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  <SkeletonField />
                  <SkeletonField />
                  <div className="space-y-3 sm:col-span-2">
                    <SkeletonBlock className="h-2.5 w-20 rounded-full" />
                    <SkeletonBlock className="h-12 w-full rounded-xl" />
                  </div>

                  <div className="space-y-3 sm:col-span-2">
                    <SkeletonBlock className="h-2.5 w-24 rounded-full" />
                    <SkeletonBlock className="h-32 w-full rounded-xl" />
                  </div>

                  <div className="flex justify-end sm:col-span-2">
                    <SkeletonBlock className="h-11 w-36 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

function SkeletonMetric() {
  return (
    <div className="space-y-2">
      <SkeletonBlock className="h-8 w-16 rounded-md" />
      <SkeletonBlock className="h-2.5 w-20 rounded-full" />
    </div>
  );
}

function SkeletonField() {
  return (
    <div className="space-y-3">
      <SkeletonBlock className="h-2.5 w-20 rounded-full" />
      <SkeletonBlock className="h-12 w-full rounded-xl" />
    </div>
  );
}

function SkeletonHeading({
  width,
}: {
  width: "portfolio" | "quote" | "testimonials" | "about" | "contact";
}) {
  const titleWidths = {
    portfolio: "w-64 sm:w-80",
    quote: "w-72 sm:w-96",
    testimonials: "w-72 sm:w-96",
    about: "w-56 sm:w-72",
    contact: "w-64 sm:w-80",
  };

  return (
    <div className="mb-12 space-y-4">
      <SkeletonBlock className="h-3 w-24 rounded-full" />
      <SkeletonBlock className={`h-10 rounded-md sm:h-12 ${titleWidths[width]}`} />
      <SkeletonBlock className="h-3.5 w-[min(520px,90%)] rounded-full" />
    </div>
  );
}

function SkeletonTestimonial() {
  return (
    <div className="rounded-[20px] border border-white/[0.06] p-6 sm:p-7">
      <div className="mb-6 flex items-center gap-4">
        <SkeletonBlock className="h-12 w-12 shrink-0 rounded-full" />

        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-28 rounded-full" />
          <SkeletonBlock className="h-2.5 w-20 rounded-full" />
        </div>
      </div>

      <div className="space-y-3">
        <SkeletonBlock className="h-3.5 w-full rounded-full" />
        <SkeletonBlock className="h-3.5 w-[92%] rounded-full" />
        <SkeletonBlock className="h-3.5 w-[78%] rounded-full" />
      </div>
    </div>
  );
}

function SkeletonInfoCard() {
  return (
    <div className="rounded-[20px] border border-white/[0.06] p-6">
      <SkeletonBlock className="mb-6 h-10 w-10 rounded-xl" />
      <SkeletonBlock className="mb-4 h-5 w-32 rounded-md" />

      <div className="space-y-3">
        <SkeletonBlock className="h-3 w-full rounded-full" />
        <SkeletonBlock className="h-3 w-[90%] rounded-full" />
        <SkeletonBlock className="h-3 w-[72%] rounded-full" />
      </div>
    </div>
  );
}

function SkeletonContactCard() {
  return (
    <div className="rounded-[18px] border border-white/[0.06] p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <SkeletonBlock className="h-11 w-11 shrink-0 rounded-xl" />

        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-2.5 w-16 rounded-full" />
          <SkeletonBlock className="h-3.5 w-32 rounded-full" />
        </div>
      </div>
    </div>
  );
}
