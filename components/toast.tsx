"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Toast({
  open,
  children,
}: {
  open: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center"
      aria-hidden={!open}
    >
      <div
        role="status"
        className={cn(
          "t-toast rounded-full bg-[#1D1D1F] px-4 py-2.5 text-sm font-medium text-white shadow-lg",
          open && "is-open",
        )}
      >
        {children}
      </div>
    </div>
  );
}
