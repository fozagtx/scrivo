"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useClerk } from "@clerk/react";
import { LogOut } from "lucide-react";

import { HAS_CLERK } from "@/lib/clerk";
import { clearGuestId } from "@/lib/guest";

const cleanup = () => {
  clearGuestId();
  localStorage.removeItem("scrivo.scout.thread");
  // Full navigation: useGuestId initialises once per mount and every
  // Convex query must reset to the new guest.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional full reload to reset guest identity
  window.location.assign("/");
};

function useClerkSignOut() {
  const clerk = useClerk();
  return useCallback(async () => {
    await clerk.signOut();
    cleanup();
  }, [clerk]);
}

function useGuestSignOut() {
  return useCallback(async () => {
    cleanup();
  }, []);
}

const useSignOut = HAS_CLERK ? useClerkSignOut : useGuestSignOut;

export function SignOutButton({ collapsed }: { collapsed: boolean }) {
  const signOut = useSignOut();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  // Collapsed card escapes the rail's overflow-hidden via a portal.
  const [pos, setPos] = useState<{ left: number; bottom: number } | null>(null);

  useEffect(() => {
    if (!confirming) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirming(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirming]);

  const confirm = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await signOut();
    } finally {
      setBusy(false);
    }
  };

  const card = (
    <div
      role="alertdialog"
      aria-label="Confirm log out"
      className="flex w-44 flex-col gap-2 rounded-[10px] border border-[#E5E3DC] bg-white p-3 shadow-lg"
    >
      <p className="text-xs font-medium">Log out of Scrivo?</p>
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-md px-2.5 py-1.5 text-xs text-[#777773] hover:text-[#1D1D1F]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={busy}
          className="rounded-md bg-[#C96F5E] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {busy ? "Logging out…" : "Log out"}
        </button>
      </div>
    </div>
  );

  return (
    <div ref={anchorRef}>
      {confirming &&
        pos &&
        createPortal(
          <div className="fixed z-50" style={pos}>
            {card}
          </div>,
          document.body,
        )}
      <button
        type="button"
        aria-expanded={confirming}
        onClick={() => {
          const r = anchorRef.current?.getBoundingClientRect();
          if (!r) return;
          // Beside the rail when collapsed, above the icon when expanded.
          setPos(
            collapsed
              ? { left: r.right + 8, bottom: window.innerHeight - r.bottom }
              : { left: r.right - 176, bottom: window.innerHeight - r.top + 8 },
          );
          setConfirming(true);
        }}
        aria-label="Log out"
        title="Log out"
        className="flex size-8 items-center justify-center rounded-lg border border-[#E5E3DC] text-[#55534D] transition-colors hover:bg-[#F8F7F3]"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  );
}
