import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { scrollToTopInstant } from "../utils/smoothScroll";

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useLayoutEffect(() => {
    scrollToTopInstant();
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
      scrollToTopInstant();
      window.requestAnimationFrame(() => {
        scrollToTopInstant();
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
