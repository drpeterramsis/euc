import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useSwipeBack() {
  const navigate = useNavigate();

  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const onTouchEnd = (e: TouchEvent) => {
      const deltaX = startX - e.changedTouches[0].clientX;
      const deltaY = Math.abs(startY - e.changedTouches[0].clientY);

      // Only trigger if:
      // - Horizontal swipe > 60px (right to left = positive deltaX)
      // - Horizontal movement dominates over vertical
      if (deltaX > 60 && deltaX > deltaY * 1.5) {
        navigate(-1);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [navigate]);
}