import { useEffect, useState } from "react";
import { getLiveClocks } from "../utils/timezone";

export default function DualClock() {
  const [clocks, setClocks] = useState(getLiveClocks());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setClocks(getLiveClocks());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row items-stretch gap-3 w-full">
      {/* Cairo Clock */}
      <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <span className="text-2xl">🇪🇬</span>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Cairo · EET
          </span>
          <span className="text-2xl font-bold text-gray-800 tabular-nums leading-tight">
            {clocks.cairo.time}
          </span>
          <span className="text-xs text-gray-400 mt-0.5">
            {clocks.cairo.date}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden sm:flex items-center justify-center text-gray-300 text-xl font-light">
        |
      </div>

      {/* Prague Clock */}
      <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <span className="text-2xl">🇨🇿</span>
        <div className="flex flex-col">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
            Prague · CEST
          </span>
          <span className="text-2xl font-bold text-gray-800 tabular-nums leading-tight">
            {clocks.prague.time}
          </span>
          <span className="text-xs text-gray-400 mt-0.5">
            {clocks.prague.date}
          </span>
        </div>
      </div>
    </div>
  );
}
