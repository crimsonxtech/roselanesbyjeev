import * as React from "react";

type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  static?: boolean;
};

export function Skeleton({
  className = "",
  static: staticSkeleton = false,
  ...props
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton ${
        staticSkeleton ? "skeleton-static" : ""
      } ${className}`}
      {...props}
    />
  );
}
