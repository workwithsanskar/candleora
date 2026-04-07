import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { NavLink } from "react-router-dom";
import BrandLogo from "../../components/BrandLogo";
import adminApi from "../services/adminApi";

const navigation = [
  { label: "Dashboard", to: "/admin", icon: "dashboard" },
  { label: "Orders", to: "/admin/orders", icon: "orders" },
  { label: "Contact inbox", to: "/admin/contact-messages", icon: "messages" },
  { label: "Replacements", to: "/admin/replacements", icon: "refresh" },
  { label: "Products", to: "/admin/products", icon: "box" },
  { label: "Coupons", to: "/admin/coupons", icon: "ticket" },
  { label: "Banners", to: "/admin/banners", icon: "sparkles" },
  { label: "Customers", to: "/admin/customers", icon: "users" },
  { label: "Analytics", to: "/admin/analytics", icon: "chart" },
  { label: "Settings", to: "/admin/settings", icon: "settings" },
];

function formatBadgeCount(value) {
  const count = Number(value ?? 0);

  if (!Number.isFinite(count) || count <= 0) {
    return "";
  }

  if (count > 99) {
    return "99+";
  }

  return String(count);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeWheelDelta(event) {
  const baseDelta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;

  if (!Number.isFinite(baseDelta) || baseDelta === 0) {
    return 0;
  }

  return clamp(baseDelta, -160, 160);
}

function SidebarIcon({ name, active }) {
  const className = active ? "text-[#17120f]" : "text-white/72";

  switch (name) {
    case "dashboard":
      return (
        <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M4 12.5L12 4L20 12.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7 10.5V20H17V10.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "orders":
      return (
        <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M7 5H17" strokeLinecap="round" />
          <path d="M7 10H17" strokeLinecap="round" />
          <path d="M7 15H13" strokeLinecap="round" />
          <rect x="4" y="3" width="16" height="18" rx="3" />
        </svg>
      );
    case "messages":
      return (
        <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M4 7.5C4 6.12 5.12 5 6.5 5H17.5C18.88 5 20 6.12 20 7.5V16.5C20 17.88 18.88 19 17.5 19H6.5C5.12 19 4 17.88 4 16.5V7.5Z" />
          <path d="M5 7L12 12.25L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "refresh":
      return (
        <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M6.5 8.5A6.5 6.5 0 0 1 18 10" strokeLinecap="round" />
          <path d="M17.5 6V10H13.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17.5 15.5A6.5 6.5 0 0 1 6 14" strokeLinecap="round" />
          <path d="M6.5 18V14H10.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "box":
      return (
        <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M12 3L19 7V17L12 21L5 17V7L12 3Z" strokeLinejoin="round" />
          <path d="M5 7L12 11L19 7" strokeLinejoin="round" />
          <path d="M12 11V21" strokeLinecap="round" />
        </svg>
      );
    case "ticket":
      return (
        <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M5 8.5A2.5 2.5 0 0 1 7.5 6H18V10A2 2 0 0 0 18 14V18H7.5A2.5 2.5 0 0 1 5 15.5V8.5Z" strokeLinejoin="round" />
          <path d="M12 6V18" strokeDasharray="2.5 2.5" strokeLinecap="round" />
        </svg>
      );
    case "sparkles":
      return (
        <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M12 3L13.8 8.2L19 10L13.8 11.8L12 17L10.2 11.8L5 10L10.2 8.2L12 3Z" strokeLinejoin="round" />
          <path d="M18.5 3.5L19.2 5.3L21 6L19.2 6.7L18.5 8.5L17.8 6.7L16 6L17.8 5.3L18.5 3.5Z" strokeLinejoin="round" />
          <path d="M5.5 15.5L6.2 17.3L8 18L6.2 18.7L5.5 20.5L4.8 18.7L3 18L4.8 17.3L5.5 15.5Z" strokeLinejoin="round" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M15.5 10A3.5 3.5 0 1 0 15.5 3A3.5 3.5 0 0 0 15.5 10Z" />
          <path d="M8.5 11A2.5 2.5 0 1 0 8.5 6A2.5 2.5 0 0 0 8.5 11Z" />
          <path d="M13 20C13 17.79 14.79 16 17 16H18C20.21 16 22 17.79 22 20" strokeLinecap="round" />
          <path d="M2 20C2 18.34 3.34 17 5 17H7C8.66 17 10 18.34 10 20" strokeLinecap="round" />
        </svg>
      );
    case "chart":
      return (
        <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M4 19.5H20" strokeLinecap="round" />
          <path d="M7 16V10" strokeLinecap="round" />
          <path d="M12 16V5" strokeLinecap="round" />
          <path d="M17 16V12" strokeLinecap="round" />
        </svg>
      );
    case "settings":
      return (
        <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="1.9">
          <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5A3.5 3.5 0 1 0 12 8.5Z" />
          <path d="M4 12H2.75" strokeLinecap="round" />
          <path d="M21.25 12H20" strokeLinecap="round" />
          <path d="M12 4V2.75" strokeLinecap="round" />
          <path d="M12 21.25V20" strokeLinecap="round" />
          <path d="M6.34 6.34L5.46 5.46" strokeLinecap="round" />
          <path d="M18.54 18.54L17.66 17.66" strokeLinecap="round" />
          <path d="M17.66 6.34L18.54 5.46" strokeLinecap="round" />
          <path d="M5.46 18.54L6.34 17.66" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

function Sidebar({ open, onClose }) {
  const prefersReducedMotion = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(min-width: 768px)").matches : false,
  );
  const scrollRegionRef = useRef(null);
  const scrollAnimationRef = useRef(null);
  const scrollTargetRef = useRef(0);

  const ordersBadgeQuery = useQuery({
    queryKey: ["admin", "sidebar-badge", "orders"],
    queryFn: () =>
      adminApi.getOrders({
        reviewed: false,
        page: 0,
        size: 1,
      }),
    refetchInterval: 30000,
  });

  const contactBadgeQuery = useQuery({
    queryKey: ["admin", "sidebar-badge", "contact-messages"],
    queryFn: () =>
      adminApi.getContactMessages({
        reviewed: false,
        page: 0,
        size: 1,
      }),
    refetchInterval: 30000,
  });

  const replacementsBadgeQuery = useQuery({
    queryKey: ["admin", "sidebar-badge", "replacements"],
    queryFn: () =>
      adminApi.getReplacements({
        reviewed: false,
        page: 0,
        size: 1,
      }),
    refetchInterval: 30000,
  });

  const badgeCounts = {
    "/admin/orders": Number(ordersBadgeQuery.data?.totalElements ?? 0),
    "/admin/contact-messages": Number(contactBadgeQuery.data?.totalElements ?? 0),
    "/admin/replacements": Number(replacementsBadgeQuery.data?.totalElements ?? 0),
  };

  useEffect(() => {
    return () => {
      scrollAnimationRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const syncDesktopState = (event) => {
      setIsDesktop(event.matches);
    };

    setIsDesktop(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncDesktopState);
      return () => mediaQuery.removeEventListener("change", syncDesktopState);
    }

    mediaQuery.addListener(syncDesktopState);
    return () => mediaQuery.removeListener(syncDesktopState);
  }, []);

  const syncScrollTarget = () => {
    if (!scrollRegionRef.current) {
      return;
    }

    scrollTargetRef.current = scrollRegionRef.current.scrollTop;
  };

  const handleSidebarWheel = (event) => {
    const scrollRegion = scrollRegionRef.current;
    if (!scrollRegion) {
      return;
    }

    const maxScrollTop = Math.max(0, scrollRegion.scrollHeight - scrollRegion.clientHeight);
    if (maxScrollTop <= 0) {
      return;
    }

    const normalizedDelta = normalizeWheelDelta(event);
    if (!normalizedDelta) {
      return;
    }

    const currentScrollTop = scrollRegion.scrollTop;
    const atTop = currentScrollTop <= 0;
    const atBottom = currentScrollTop >= maxScrollTop - 1;

    if ((normalizedDelta < 0 && atTop) || (normalizedDelta > 0 && atBottom)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const baseScrollTop = Number.isFinite(scrollTargetRef.current) ? scrollTargetRef.current : currentScrollTop;
    const nextScrollTop = clamp(baseScrollTop + normalizedDelta, 0, maxScrollTop);
    scrollTargetRef.current = nextScrollTop;

    scrollAnimationRef.current?.stop();

    if (prefersReducedMotion) {
      scrollRegion.scrollTop = nextScrollTop;
      return;
    }

    scrollAnimationRef.current = animate(currentScrollTop, nextScrollTop, {
      type: "spring",
      stiffness: 220,
      damping: 30,
      mass: 0.22,
      restDelta: 0.5,
      onUpdate: (latest) => {
        if (scrollRegionRef.current) {
          scrollRegionRef.current.scrollTop = latest;
        }
      },
    });
  };

  return (
    <>
      <motion.div
        className={`fixed inset-0 z-30 bg-black/35 md:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden="true"
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        onClick={onClose}
      />

      <motion.aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col overflow-hidden border-r border-black/10 bg-[#17120f] px-4 py-4 text-white sm:w-[272px] md:sticky md:top-0 md:h-screen md:self-start md:translate-x-0 xl:w-[272px]`}
        initial={false}
        animate={{
          x: isDesktop || open ? 0 : -296,
          opacity: isDesktop || open ? 1 : 0.98,
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          ref={scrollRegionRef}
          className="mini-cart-scroll-view stealth-scrollbar touch-pan-y flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain scroll-smooth pr-1"
          data-lenis-prevent="true"
          data-lenis-prevent-wheel="true"
          data-lenis-prevent-touch="true"
          onScroll={syncScrollTarget}
          onWheelCapture={handleSidebarWheel}
        >
          <motion.div
            className="flex items-start justify-between gap-3"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
          >
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d5bf98]">
                <span className="h-2 w-2 rounded-full bg-[#f3b33d]" />
                Admin
              </div>

              <BrandLogo
                tone="light"
                showTagline
                className="mt-5 max-w-[186px]"
                imageClassName="origin-left"
              />
            </div>

            <button
              type="button"
              className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/70 md:hidden"
              onClick={onClose}
            >
              Close
            </button>
          </motion.div>

          <div className="mt-6">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/35">
              Navigation
            </p>
            <motion.nav
              className="mt-3 space-y-1.5"
              initial={false}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.03, delayChildren: 0.04 }}
            >
              {navigation.map((item) => (
                <motion.div
                  key={item.to}
                  initial={false}
                  whileHover={prefersReducedMotion ? undefined : { x: 3 }}
                  transition={{ type: "spring", stiffness: 340, damping: 26 }}
                >
                  <NavLink
                    to={item.to}
                    end={item.to === "/admin"}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 rounded-[20px] border px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? "border-[#f3b33d] bg-[#f3b33d] text-[#17120f]"
                          : "border-transparent text-white/72 hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <motion.span
                          layout
                          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                            isActive
                              ? "border-black/10 bg-white/30"
                              : "border-white/10 bg-white/[0.04] group-hover:border-white/15"
                          }`}
                          transition={{ type: "spring", stiffness: 340, damping: 28 }}
                        >
                          <SidebarIcon name={item.icon} active={isActive} />
                        </motion.span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate">{item.label}</p>
                        </div>

                        {badgeCounts[item.to] > 0 ? (
                          <motion.span
                            layout
                            initial={{ scale: 0.82, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 360, damping: 24 }}
                            className={`inline-flex min-w-[28px] items-center justify-center rounded-full px-2 py-1 text-[11px] font-semibold ${
                              isActive
                                ? "bg-[#17120f] text-white"
                                : "bg-[#f3b33d] text-[#17120f]"
                            }`}
                            aria-label={`${item.label} count ${formatBadgeCount(badgeCounts[item.to])}`}
                          >
                            {formatBadgeCount(badgeCounts[item.to])}
                          </motion.span>
                        ) : null}

                        <motion.svg
                          viewBox="0 0 24 24"
                          className={`h-4 w-4 ${isActive ? "text-[#17120f]" : "text-white/35 group-hover:text-white/65"}`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.9"
                          animate={isActive && !prefersReducedMotion ? { x: 2 } : { x: 0 }}
                          transition={{ type: "spring", stiffness: 360, damping: 26 }}
                        >
                          <path d="M9 6L15 12L9 18" strokeLinecap="round" strokeLinejoin="round" />
                        </motion.svg>
                      </>
                    )}
                  </NavLink>
                </motion.div>
              ))}
            </motion.nav>
          </div>

          <motion.div
            className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.04] p-3.5"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut", delay: 0.04 }}
          >
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/42">Security</p>
            <p className="mt-2 text-[13px] leading-6 text-white/70">
              Admin routes stay role-protected and separate from customer flows.
            </p>
          </motion.div>
        </motion.div>
      </motion.aside>
    </>
  );
}

SidebarIcon.propTypes = {
  name: PropTypes.string.isRequired,
  active: PropTypes.bool.isRequired,
};

Sidebar.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Sidebar;
