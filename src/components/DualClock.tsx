import { useEffect, useState } from "react";
import { getLiveClocks, splitAmPm } from "../utils/timezone";

export default function DualClock() {
  const [clocks, setClocks] = useState(getLiveClocks());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setClocks(getLiveClocks());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-row items-stretch gap-2 w-full">
      {/* Prague Clock — Soft Amber BG */}
      <div className="flex-1 flex items-center gap-1.5 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 bg-amber-100 rounded-2xl border border-amber-300 shadow-sm">
        <span className="text-lg sm:text-2xl">🇨🇿</span>
        <div className="flex flex-col">
          <span className="text-[10px] sm:text-xs font-medium text-amber-700 uppercase tracking-wide">
            Prague · CEST
          </span>
          {(() => {
            const { digits, period } = splitAmPm(clocks.prague.time);
            return (
              <span className="text-base sm:text-2xl font-bold text-amber-900 tabular-nums leading-tight">
                {digits}
                <span className="text-[10px] font-semibold ml-0.5 text-amber-500 tracking-wide">
                  {period}
                </span>
              </span>
            );
          })()}
          <span className="hidden sm:block text-xs text-gray-400 mt-0.5">
            {clocks.prague.date}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden sm:flex items-center justify-center text-gray-300 text-xl font-light">
        |
      </div>

      {/* Cairo Clock — Soft Blue BG */}
      <div className="flex-1 flex items-center gap-1.5 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 bg-blue-50 rounded-2xl border border-blue-200 shadow-sm">
        <span className="text-lg sm:text-2xl">🇪🇬</span>
        <div className="flex flex-col">
          <span className="text-[10px] sm:text-xs font-medium text-blue-700 uppercase tracking-wide">
            Cairo · EET
          </span>
          {(() => {
            const { digits, period } = splitAmPm(clocks.cairo.time);
            return (
              <span className="text-base sm:text-2xl font-bold text-blue-800 tabular-nums leading-tight">
                {digits}
                <span className="text-[10px] font-semibold ml-0.5 text-amber-500 tracking-wide">
                  {period}
                </span>
              </span>
            );
          })()}
          <span className="hidden sm:block text-xs text-gray-400 mt-0.5">
            {clocks.cairo.date}
          </span>
        </div>
      </div>
    </div>
  );
}
