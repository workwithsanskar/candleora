import PropTypes from "prop-types";
import { startTransition, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Topbar({ title, searchValue, onSearchChange, onOpenSidebar, placeholder }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = useMemo(() => {
    const source = String(user?.name ?? user?.email ?? "CA")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
    return source || "CA";
  }, [user?.email, user?.name]);

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
            <p className="text-xs uppercase tracking-[0.24em] text-brand-muted">Admin workspace</p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-brand-dark">{title}</h2>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex h-11 min-w-[240px] items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 shadow-sm">
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

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white text-brand-dark shadow-sm"
            aria-label="Notifications"
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
          </button>

          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-3 py-2 shadow-sm"
              onClick={() => setMenuOpen((current) => !current)}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#17120f] text-sm font-semibold text-white">
                {initials}
              </span>
              <span className="text-left">
                <span className="block text-sm font-medium text-brand-dark">{user?.name ?? "CandleOra Admin"}</span>
                <span className="block text-xs uppercase tracking-[0.18em] text-brand-muted">
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
};

export default Topbar;
