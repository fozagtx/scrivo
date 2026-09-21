"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const t = requestAnimationFrame(() => el.classList.add("is-shown"));
    return () => cancelAnimationFrame(t);
  }, []);
  return (
    <div ref={ref} className={cn("t-stagger", className)}>
      {children}
    </div>
  );
}

export function RevealLine({
  children,
  index = 0,
  className,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  const style: CSSProperties | undefined =
    index > 0
      ? { transitionDelay: `calc(var(--stagger-stagger) * ${index})` }
      : undefined;
  return (
    <div className={cn("t-stagger-line", className)} style={style}>
      {children}
    </div>
  );
}
