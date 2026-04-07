import PropTypes from "prop-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { animate, useReducedMotion } from "framer-motion";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import adminApi from "../services/adminApi";
import { formatApiError, formatDateTime } from "../../utils/format";
import { pauseSmoothScroll, resumeSmoothScroll } from "../../utils/smoothScroll";

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatBadgeCount(value) {
  const count = Number(value ?? 0);

  if (!Number.isFinite(count) || count <= 0) {
    return "";
  }

  return count > 99 ? "99+" : String(count);
}

function resolveNotificationLink(item) {
  switch (item?.type) {
    case "ORDER":
      return `/admin/orders?focusOrder=${item.entityId}`;
    case "CONTACT":
      return `/admin/contact-messages?focusMessage=${item.entityId}`;
    case "REPLACEMENT":
      return `/admin/replacements/${item.entityId}`;
    default:
      return "/admin";
  }
}

function Topbar({ title, searchValue, onSearchChange, onOpenSidebar, placeholder, searchEnabled }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const menuRef = useRef(null);
  const notificationsRef = useRef(null);
  const notificationsScrollRef = useRef(null);
  const notificationsScrollAnimationRef = useRef(null);
  const notificationsScrollTargetRef = useRef(0);
  const prefersReducedMotion = useReducedMotion();

  const initials = useMemo(() => {
    const source = String(user?.name ?? user?.email ?? "CA")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
    return source || "CA";
  }, [user?.email, user?.name]);

  const notificationsQuery = useQuery({
    queryKey: ["admin", "notifications", "topbar"],
    queryFn: () => adminApi.getNotifications({ limit: 8 }),
    refetchInterval: 30000,
  });

  const markAllReviewedMutation = useMutation({
    mutationFn: () => adminApi.markAllNotificationsReviewed({ limit: 8 }),
    onSuccess: async (response) => {
      queryClient.setQueryData(["admin", "notifications", "topbar"], response);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "sidebar-badge", "orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "sidebar-badge", "contact-messages"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "sidebar-badge", "replacements"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "orders"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "contact-messages"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "replacements"] }),
      ]);
      toast.success("All notifications marked as reviewed.");
    },
    onError: (error) => {
      toast.error(formatApiError(error));
    },
  });

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }

      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!notificationsOpen) {
      return undefined;
    }

    pauseSmoothScroll();
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      resumeSmoothScroll();
    };
  }, [notificationsOpen]);

  useEffect(() => {
    return () => {
      notificationsScrollAnimationRef.current?.stop();
    };
  }, []);

  const totalUnread = Number(notificationsQuery.data?.totalUnread ?? 0);
  const notificationGroups = [
    { label: "Orders", value: notificationsQuery.data?.unreadOrders ?? 0 },
    { label: "Contact", value: notificationsQuery.data?.unreadContactMessages ?? 0 },
    { label: "Replacements", value: notificationsQuery.data?.unreadReplacements ?? 0 },
  ];

  const handleOpenNotification = (item) => {
    setNotificationsOpen(false);
    navigate(resolveNotificationLink(item));
  };

  const syncNotificationScrollTarget = () => {
    if (!notificationsScrollRef.current) {
      return;
    }

    notificationsScrollTargetRef.current = notificationsScrollRef.current.scrollTop;
  };

  const handleNotificationsWheel = (event) => {
    const scrollRegion = notificationsScrollRef.current;
    if (!scrollRegion) {
      return;
    }

    const maxScrollTop = Math.max(0, scrollRegion.scrollHeight - scrollRegion.clientHeight);
    if (maxScrollTop <= 0) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const normalizedDelta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    if (!normalizedDelta) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const currentScrollTop = scrollRegion.scrollTop;
    const baseScrollTop = Number.isFinite(notificationsScrollTargetRef.current)
      ? notificationsScrollTargetRef.current
      : currentScrollTop;
    const nextScrollTop = clamp(baseScrollTop + normalizedDelta, 0, maxScrollTop);
    notificationsScrollTargetRef.current = nextScrollTop;

    notificationsScrollAnimationRef.current?.stop();

    if (prefersReducedMotion) {
      scrollRegion.scrollTop = nextScrollTop;
      return;
    }

    notificationsScrollAnimationRef.current = animate(currentScrollTop, nextScrollTop, {
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        if (notificationsScrollRef.current) {
          notificationsScrollRef.current.scrollTop = latest;
        }
      },
    });
  };

  return (
    <header className="sticky top-0 z-20 border-b border-black/8 bg-[#f5efe3]/95 backdrop-blur">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white text-brand-dark shadow-sm md:hidden"
            onClick={onOpenSidebar}
            aria-label="Open admin navigation"
          >
            <span className="space-y-1.5">
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
              <span className="block h-0.5 w-5 bg-current" />
            </span>
          </button>

          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-brand-muted">Admin</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-brand-dark">{title}</h2>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {searchEnabled ? (
            <label className="flex h-11 w-full min-w-0 items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 shadow-sm sm:min-w-[220px] sm:flex-1 lg:max-w-[420px]">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand-muted" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                value={searchValue}
                onChange={(event) => startTransition(() => onSearchChange(event.target.value))}
                placeholder={placeholder}
                className="w-full border-none bg-transparent text-sm outline-none placeholder:text-brand-muted"
              />
            </label>
          ) : null}

          <div ref={notificationsRef} className="relative">
            <button
              type="button"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white text-brand-dark shadow-sm"
              aria-label="Notifications"
              onClick={() => {
                setNotificationsOpen((current) => !current);
                setMenuOpen(false);
              }}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                <path
                  d="M6 9a6 6 0 1 1 12 0v4l1.5 2.5H4.5L6 13V9Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>

              {totalUnread > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-[22px] items-center justify-center rounded-full bg-[#17120f] px-1.5 py-1 text-[10px] font-semibold text-white">
                  {formatBadgeCount(totalUnread)}
                </span>
              ) : null}
            </button>

            {notificationsOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[min(360px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] rounded-[28px] border border-black/10 bg-white p-3 shadow-[0_24px_70px_rgba(0,0,0,0.14)]">
                <div className="flex items-start justify-between gap-3 border-b border-black/8 px-2 pb-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-muted">Notifications</p>
                    <h3 className="mt-1 font-display text-2xl font-semibold text-brand-dark">Admin activity</h3>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-black/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-dark transition hover:border-black/20 hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={!totalUnread || markAllReviewedMutation.isPending}
                    onClick={() => markAllReviewedMutation.mutate()}
                  >
                    {markAllReviewedMutation.isPending ? "Saving..." : "Mark all"}
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 px-2">
                  {notificationGroups.map((group) => (
                    <div
                      key={group.label}
                      className="flex min-w-0 flex-col items-center justify-center rounded-[20px] border border-black/8 bg-[#fbf7f0] px-2 py-3 text-center"
                    >
                      <p className="min-h-[24px] w-full text-[8px] font-semibold uppercase leading-[1.35] tracking-[0.12em] text-brand-muted">
                        {group.label}
                      </p>
                      <p className="mt-3 font-display text-2xl font-semibold leading-none text-brand-dark">
                        {group.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div
                  ref={notificationsScrollRef}
                  className="mini-cart-scroll-view stealth-scrollbar mt-3 max-h-[360px] touch-pan-y overflow-y-auto overscroll-contain scroll-smooth px-1"
                  data-lenis-prevent="true"
                  data-lenis-prevent-wheel="true"
                  data-lenis-prevent-touch="true"
                  onScroll={syncNotificationScrollTarget}
                  onWheelCapture={handleNotificationsWheel}
                >
                  {notificationsQuery.isLoading ? (
                    <div className="space-y-2 px-1 py-2">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-20 animate-pulse rounded-[22px] bg-black/6" />
                      ))}
                    </div>
                  ) : notificationsQuery.data?.items?.length ? (
                    <div className="space-y-2">
                      {notificationsQuery.data.items.map((item) => (
                        <button
                          key={`${item.type}-${item.entityId}`}
                          type="button"
                          className="w-full rounded-[22px] border border-transparent bg-white px-4 py-3 text-left transition hover:border-black/8 hover:bg-[#fbf7f0]"
                          onClick={() => handleOpenNotification(item)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex rounded-full bg-[#fff1d8] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#986700]">
                                  {item.type}
                                </span>
                                <p className="truncate text-sm font-semibold text-brand-dark">{item.title}</p>
                              </div>
                              <p className="mt-2 text-sm text-brand-muted">{item.subtitle}</p>
                              <p className="mt-1 text-xs leading-5 text-brand-muted">{item.detail}</p>
                            </div>
                            <span className="shrink-0 text-[11px] font-medium text-brand-muted">
                              {formatDateTime(item.timestamp)}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[22px] border border-dashed border-black/10 bg-[#fbf7f0] px-4 py-8 text-center">
                      <h4 className="font-display text-xl font-semibold text-brand-dark">All clear</h4>
                      <p className="mt-2 text-sm leading-6 text-brand-muted">
                        New orders, contact messages, and replacements will appear here.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div ref={menuRef} className="relative max-w-full">
            <button
              type="button"
              className="flex max-w-full items-center gap-3 rounded-2xl border border-black/10 bg-white px-3 py-2 shadow-sm"
              onClick={() => {
                setMenuOpen((current) => !current);
                setNotificationsOpen(false);
              }}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#17120f] text-sm font-semibold text-white">
                {initials}
              </span>
              <span className="min-w-0 text-left">
                <span className="block truncate text-sm font-medium text-brand-dark">{user?.name ?? "CandleOra Admin"}</span>
                <span className="block truncate text-xs uppercase tracking-[0.18em] text-brand-muted">
                  {String(user?.role ?? "ADMIN")}
                </span>
              </span>
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-[calc(100%+0.75rem)] w-64 rounded-3xl border border-black/10 bg-white p-3 shadow-[0_18px_50px_rgba(0,0,0,0.12)]">
                <p className="px-3 py-2 text-sm font-medium text-brand-dark">{user?.email}</p>
                <button
                  type="button"
                  className="mt-1 w-full rounded-2xl px-3 py-2 text-left text-sm text-brand-dark transition hover:bg-black/5"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/profile/details");
                  }}
                >
                  Account settings
                </button>
                <button
                  type="button"
                  className="mt-1 w-full rounded-2xl px-3 py-2 text-left text-sm text-brand-dark transition hover:bg-black/5"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/admin/settings");
                  }}
                >
                  Admin settings
                </button>
                <button
                  type="button"
                  className="mt-1 w-full rounded-2xl px-3 py-2 text-left text-sm text-danger transition hover:bg-danger/10"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                    navigate("/");
                  }}
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

Topbar.propTypes = {
  title: PropTypes.string.isRequired,
  searchValue: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  onOpenSidebar: PropTypes.func.isRequired,
  placeholder: PropTypes.string.isRequired,
  searchEnabled: PropTypes.bool,
};

Topbar.defaultProps = {
  searchEnabled: true,
};

export default Topbar;
