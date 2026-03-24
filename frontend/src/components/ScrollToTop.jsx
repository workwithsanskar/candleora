import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

function scrollWindowToTop() {
  if (typeof window === "undefined" || typeof window.scrollTo !== "function") {
    return;
  }

  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useLayoutEffect(() => {
    scrollWindowToTop();
  }, [pathname, search]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const { history } = window;
    const previousScrollRestoration = history.scrollRestoration;

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const handlePageShow = () => {
      scrollWindowToTop();
      window.requestAnimationFrame(() => {
        scrollWindowToTop();
      });
    };

    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);

      if ("scrollRestoration" in history) {
        history.scrollRestoration = previousScrollRestoration;
      }
    };
  }, []);

  return null;
}

export default ScrollToTop;
