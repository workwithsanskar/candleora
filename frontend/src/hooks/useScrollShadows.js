import { useEffect, useState } from "react";

function getShadowState(element) {
  if (!(element instanceof HTMLElement)) {
    return {
      showTop: false,
      showBottom: false,
    };
  }

  const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight);

  return {
    showTop: element.scrollTop > 8,
    showBottom: element.scrollTop < maxScrollTop - 8,
  };
}

function useScrollShadows(ref, enabled = true) {
  const [shadowState, setShadowState] = useState({
    showTop: false,
    showBottom: false,
  });

  useEffect(() => {
    if (!enabled) {
      setShadowState({
        showTop: false,
        showBottom: false,
      });
      return undefined;
    }

    const element = ref.current;
    if (!(element instanceof HTMLElement)) {
      return undefined;
    }

    const updateShadows = () => {
      setShadowState(getShadowState(element));
    };

    updateShadows();

    element.addEventListener("scroll", updateShadows, { passive: true });
    window.addEventListener("resize", updateShadows, { passive: true });

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(updateShadows);
      resizeObserver.observe(element);
    }

    return () => {
      element.removeEventListener("scroll", updateShadows);
      window.removeEventListener("resize", updateShadows);
      resizeObserver?.disconnect();
    };
  }, [enabled, ref]);

  return shadowState;
}

export default useScrollShadows;
