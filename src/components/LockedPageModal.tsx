import React, { useEffect } from "react";

interface LockedPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageName?: string;
}

export default function LockedPageModal({
  isOpen,
  onClose,
  pageName = "This page",
}: LockedPageModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handler);
    }
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm
                 z-[100] flex items-center justify-center px-4
                 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl
                   max-w-sm w-full px-8 py-8
                   flex flex-col items-center text-center gap-4
                   animate-in zoom-in-95
                   duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lock Icon */}
        <div className="w-20 h-20 rounded-full
                        bg-amber-50 border-2 border-amber-200
                        flex items-center justify-center
                        text-4xl">
          🔒
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900">
          Coming Soon
        </h2>

        {/* Divider */}
        <div className="w-12 h-0.5 bg-amber-300 rounded-full" />

        {/* Description */}
        <p className="text-sm text-gray-500 leading-relaxed">
          This feature is coming soon to your account.
          <br />
          Stay tuned for updates!
        </p>

        {/* Page Name Pill */}
        <span className="inline-flex items-center gap-2
                         px-4 py-1.5 rounded-full
                         bg-gray-100 border border-gray-200
                         text-gray-600 text-sm font-medium">
          🔒 {pageName}
        </span>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="mt-2 w-full py-3 rounded-2xl
                     bg-amber-400 hover:bg-amber-500
                     text-white font-bold text-sm
                     transition-all duration-200
                     shadow-md hover:shadow-lg
                     active:scale-95 cursor-pointer border-none"
        >
          Got it
        </button>

        {/* Hint */}
        <p className="text-xs text-gray-400 -mt-2">
          You can still browse available pages
        </p>
      </div>
    </div>
  );
}
