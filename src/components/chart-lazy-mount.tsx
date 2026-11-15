// Components/ui/chart-lazy-mount.tsx

import { type ReactNode, useEffect, useRef, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";

interface ChartLazyMountProps {
  children: ReactNode;
  /** Reserved height so the layout doesn't shift when the chart mounts. */
  height?: number;
  /** Root margin for the IntersectionObserver. */
  rootMargin?: string;
}

export function ChartLazyMount({
  children,
  height = 300,
  rootMargin = "200px",
}: ChartLazyMountProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [rootMargin]);

  return (
    <div ref={ref} style={{ minHeight: height }}>
      {visible ? children : <Skeleton className="w-full" style={{ height }} />}
    </div>
  );
}
