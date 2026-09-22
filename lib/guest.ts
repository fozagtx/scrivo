"use client";

import { useState } from "react";

const KEY = "scrivo_guest_id";

export function getGuestId(): string {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export function setGuestId(id: string) {
  localStorage.setItem(KEY, id);
}

export function clearGuestId() {
  localStorage.removeItem(KEY);
}

/** Stable per-browser guest id; null during SSR/prerender. */
export function useGuestId(): string | null {
  const [id] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getGuestId(),
  );
  return id;
}
