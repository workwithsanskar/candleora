import Lenis from "lenis";

let lenisInstance = null;
let rafId = null;
let pauseLockCount = 0;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
  );
}

function isCoarsePointer() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(pointer: coarse)")?.matches
  );
}

function onAnimationFrame(time) {
  lenisInstance?.raf(time);
  rafId = window.requestAnimationFrame(onAnimationFrame);
}

export function initSmoothScroll() {
  if (typeof window === "undefined" || prefersReducedMotion() || isCoarsePointer()) {
    return null;
  }

  if (lenisInstance) {
    return lenisInstance;
  }

  lenisInstance = new Lenis({
    duration: 1,
    smoothWheel: true,
    syncTouch: false,
    wheelMultiplier: 0.9,
    touchMultiplier: 1,
  });

  rafId = window.requestAnimationFrame(onAnimationFrame);
  return lenisInstance;
}

export function resizeSmoothScroll() {
  lenisInstance?.resize();
}

export function pauseSmoothScroll() {
  pauseLockCount += 1;
  if (pauseLockCount === 1) {
    lenisInstance?.stop();
  }
}

export function resumeSmoothScroll() {
  pauseLockCount = Math.max(0, pauseLockCount - 1);
  if (pauseLockCount === 0) {
    lenisInstance?.start();
  }
}

export function scrollToTopInstant() {
  if (lenisInstance) {
    lenisInstance.scrollTo(0, { immediate: true, force: true });
    return;
  }

  if (typeof window !== "undefined") {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }
}

export function destroySmoothScroll() {
  if (typeof window !== "undefined" && rafId) {
    window.cancelAnimationFrame(rafId);
  }

  lenisInstance?.destroy();
  lenisInstance = null;
  rafId = null;
  pauseLockCount = 0;
}
