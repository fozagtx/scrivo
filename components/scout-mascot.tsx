"use client";

import { Mascot } from "page-mascot";

import { cn } from "@/lib/utils";

const DIRECTIONS = "/mascots/glasses-directions.webp";
const REACTIONS = "/mascots/glasses-reactions.webp";

/** Scout's face: follows the cursor, reacts when poked. */
export function ScoutMascot({
  size = 120,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Mascot
      directions={DIRECTIONS}
      reactions={REACTIONS}
      size={size}
      label="Scout"
      className={className}
    />
  );
}

/** Static center cell of the same sheet, for message avatars. */
export function ScoutAvatar({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Scout"
      className={cn(
        "block size-7 shrink-0 rounded-lg bg-[#EAF2FF] bg-[length:300%_300%] bg-[position:50%_50%] bg-no-repeat",
        className,
      )}
      style={{ backgroundImage: `url(${DIRECTIONS})` }}
    />
  );
}
