import { animate, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeWheelDelta(event) {
  if (!event) {
    return 0;
  }

  return event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
}

function isScrollableElement(element) {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const styles = window.getComputedStyle(element);
  const overflowY = styles.overflowY;
  return (
    ["auto", "scroll", "overlay"].includes(overflowY) &&
    element.scrollHeight - element.clientHeight > 1
  );
}

function canScrollElement(element, delta) {
  if (!isScrollableElement(element)) {
    return false;
  }

  const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight);
  const scrollTop = element.scrollTop;
  const canScrollUp = scrollTop > 0;
  const canScrollDown = scrollTop < maxScrollTop - 1;

  if (delta < 0) {
    return canScrollUp;
  }

  if (delta > 0) {
    return canScrollDown;
  }

  return maxScrollTop > 0;
}

function findScrollableTarget(startTarget, boundary, delta) {
  if (!(boundary instanceof HTMLElement)) {
    return null;
  }

  let current =
    startTarget instanceof HTMLElement ? startTarget : startTarget?.parentElement ?? null;

  while (current) {
    if (canScrollElement(current, delta)) {
      return current;
    }

    if (current === boundary) {
      break;
    }

    current = current.parentElement;
  }

  return null;
}

function useSmoothWheelScroll({ disabled = false, duration = 0.28, fallbackTargetRef = null } = {}) {
  const prefersReducedMotion = useReducedMotion();
  const scrollAnimationsRef = useRef(new Map());
  const scrollTargetsRef = useRef(new Map());

  useEffect(() => {
    return () => {
      scrollAnimationsRef.current.forEach((animation) => animation?.stop?.());
      scrollAnimationsRef.current.clear();
      scrollTargetsRef.current.clear();
    };
  }, []);

  const handleScrollCapture = useCallback((event) => {
    if (!(event.target instanceof HTMLElement)) {
      return;
    }

    scrollTargetsRef.current.set(event.target, event.target.scrollTop);
  }, []);

  const handleWheel = useCallback(
    (event, boundaryOverride = null) => {
      if (disabled) {
        return false;
      }

      const boundary =
        boundaryOverride instanceof HTMLElement ? boundaryOverride : event.currentTarget;
      const normalizedDelta = normalizeWheelDelta(event);
      if (!(boundary instanceof HTMLElement) || !normalizedDelta) {
        return false;
      }

      const fallbackTarget =
        fallbackTargetRef && "current" in fallbackTargetRef ? fallbackTargetRef.current : null;
      const scrollTarget =
        findScrollableTarget(event.target, boundary, normalizedDelta) ||
        (canScrollElement(fallbackTarget, normalizedDelta) ? fallbackTarget : null);
      if (!scrollTarget) {
        return false;
      }

      event.preventDefault();
      event.stopPropagation();

      const maxScrollTop = Math.max(0, scrollTarget.scrollHeight - scrollTarget.clientHeight);
      const currentScrollTop = scrollTarget.scrollTop;
      const baseScrollTop = Number.isFinite(scrollTargetsRef.current.get(scrollTarget))
        ? scrollTargetsRef.current.get(scrollTarget)
        : currentScrollTop;
      const nextScrollTop = clamp(baseScrollTop + normalizedDelta, 0, maxScrollTop);

      scrollTargetsRef.current.set(scrollTarget, nextScrollTop);
      scrollAnimationsRef.current.get(scrollTarget)?.stop?.();

      if (prefersReducedMotion) {
        scrollTarget.scrollTop = nextScrollTop;
        return true;
      }

      const animation = animate(currentScrollTop, nextScrollTop, {
        duration,
        ease: [0.22, 1, 0.36, 1],
        onUpdate: (latest) => {
          if (!(scrollTarget instanceof HTMLElement) || !scrollTarget.isConnected) {
            return;
          }

          scrollTarget.scrollTop = latest;
          scrollTargetsRef.current.set(scrollTarget, latest);
        },
      });

      scrollAnimationsRef.current.set(scrollTarget, animation);
      return true;
    },
    [disabled, duration, fallbackTargetRef, prefersReducedMotion],
  );

  return {
    onWheel: handleWheel,
    onScrollCapture: handleScrollCapture,
  };
}

export default useSmoothWheelScroll;
