"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import { NewAlertWizard } from "@/components/new-alert-wizard";

export function NewAlertModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#1D1D1F]/40 p-4 md:p-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="New alert"
        className="relative my-auto w-full max-w-[1180px] rounded-[18px] border border-[#E5E3DC] bg-[#F8F7F3] p-5 shadow-2xl md:p-8"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-2 text-[#777773] transition-colors hover:bg-[#F1F0EB] hover:text-[#1D1D1F]"
        >
          <X className="size-4" />
        </button>
        <NewAlertWizard onCancel={onClose} onCreated={onCreated} />
      </div>
    </div>
  );
}
