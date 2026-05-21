import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useSwipeBack() {
  const navigate = useNavigate();
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    const onStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const onEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (startX < 30 && dx > 80 && Math.abs(dy) < 60) {
        navigate(-1);
      }
    };
    document.addEventListener("touchstart", onStart);
    document.addEventListener("touchend", onEnd);
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
    };
  }, [navigate]);
}
