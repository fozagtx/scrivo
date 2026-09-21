"use client";

import { useRef, useState } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

export function SaveButton({
  saved,
  onToggle,
  className,
}: {
  saved: boolean;
  onToggle: () => void;
  className?: string;
}) {
  const [bursting, setBursting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <button
      type="button"
      aria-label={saved ? "Remove from saved" : "Save deal"}
      aria-pressed={saved}
      data-liked={saved}
      className={cn(
        "t-like inline-flex items-center justify-center",
        bursting && "is-bursting",
        className,
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!saved) {
          const el = e.currentTarget;
          el.classList.remove("is-bursting");
          void el.offsetWidth;
          el.classList.add("is-bursting");
          setBursting(true);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => setBursting(false), 700);
        }
        onToggle();
      }}
    >
      <span className="t-like-icon inline-flex">
        <Bookmark className="t-like-heart size-4" strokeWidth={2} />
      </span>
      <span className="t-like-particles" aria-hidden>
        {Array.from({ length: 8 }).map((_, i) => (
          <i key={i} />
        ))}
      </span>
    </button>
  );
}
