import React from "react";
import { useAppContext } from "../context/AppContext";

type InstallButtonProps = {
  variant?: "banner" | "header" | "menu" | "settings";
};

export default function InstallButton({
  variant = "banner",
}: InstallButtonProps) {
  const { installPrompt, isAppInstalled, triggerInstall } = useAppContext();

  // Detect iOS
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.matchMedia(
    "(display-mode: standalone)"
  ).matches;

  // Already installed — show nothing
  if (isAppInstalled || isStandalone) return null;

  // ─── HEADER VARIANT ────────────────────────────────────────────
  if (variant === "header") {
    // Android/Desktop — has native prompt
    if (installPrompt) {
      return (
        <button
          onClick={triggerInstall}
          className="flex items-center gap-1 bg-yellow-400 text-black
            text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-300
            transition-all"
        >
          📲 Install
        </button>
      );
    }
    // iOS — show icon only, opens instruction modal
    if (isIOS) {
      return (
        <button
          onClick={() =>
            alert(
              "To install:\n1. Tap the Share button ⎙\n2. Tap Add to Home Screen\n3. Tap Add"
            )
          }
          className="flex items-center gap-1 bg-yellow-400 text-black
            text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-yellow-300
            transition-all"
        >
          📲 Install
        </button>
      );
    }
    return null;
  }

  // ─── MENU / SIDEBAR VARIANT ────────────────────────────────────
  if (variant === "menu") {
    return (
      <button
        onClick={installPrompt ? triggerInstall : undefined}
        className="w-full flex items-center gap-3 px-4 py-3 text-left
          bg-yellow-50 border border-yellow-200 rounded-xl
          hover:bg-yellow-100 transition-all"
      >
        <span className="text-xl">📲</span>
        <div>
          <p className="font-bold text-sm text-gray-900">Install App</p>
          <p className="text-xs text-gray-500">
            {isIOS
              ? "Tap Share → Add to Home Screen"
              : "Add to your home screen"}
          </p>
        </div>
        {!isIOS && (
          <span className="ml-auto bg-black text-white text-xs
            font-bold px-2 py-1 rounded-lg">
            Install
          </span>
        )}
      </button>
    );
  }

  // ─── SETTINGS PAGE VARIANT ─────────────────────────────────────
  if (variant === "settings") {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-4
        shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-xl flex
              items-center justify-center text-xl">
              📲
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900">
                Install EUC App
              </p>
              <p className="text-xs text-gray-500">
                {isIOS
                  ? "Use Safari → Share → Add to Home Screen"
                  : installPrompt
                  ? "Add to your home screen for quick access"
                  : "Open in Chrome to install"}
              </p>
            </div>
          </div>
          {installPrompt && !isIOS && (
            <button
              onClick={triggerInstall}
              className="bg-black text-white text-xs font-bold
                px-4 py-2 rounded-xl hover:bg-gray-800 transition-all"
            >
              Install
            </button>
          )}
          {isIOS && (
            <span className="text-xs text-gray-400 font-medium">
              Safari only
            </span>
          )}
        </div>
      </div>
    );
  }

  // ─── DEFAULT BANNER VARIANT ────────────────────────────────────
  return (
    <div className="fixed bottom-20 right-4 z-50">
      <button
        onClick={installPrompt ? triggerInstall : undefined}
        className="bg-black text-white flex items-center gap-2
          px-4 py-3 rounded-2xl shadow-2xl font-bold text-sm
          hover:bg-gray-800 transition-all active:scale-95"
      >
        📲
        <span>
          {isIOS ? "How to Install" : "Install App"}
        </span>
      </button>
    </div>
  );
}
