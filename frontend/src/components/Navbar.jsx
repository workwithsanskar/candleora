import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const mainLinks = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Occasion Picks", to: "/occasion-picks" },
  { label: "Styling Guides", to: "/styling-guides" },
  { label: "Candle Fixes", to: "/candle-fixes" },
  { label: "FAQ", to: "/faq" },
];

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const { cartCount } = useCart();

  return (
    <header className="sticky top-0 z-30 border-b border-brand-primary/10 bg-white/80 backdrop-blur-xl">
      <div className="container-shell">
        <div className="flex items-center justify-between gap-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-primary text-lg font-bold text-white shadow-candle">
              CO
            </div>
            <div>
              <p className="font-display text-2xl font-semibold leading-none text-brand-dark">
                CandleOra
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.24em] text-brand-muted">
                Hand-poured warmth
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {mainLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-semibold transition ${
                    isActive ? "text-brand-primary" : "text-brand-dark/80 hover:text-brand-primary"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              to="/cart"
              className="rounded-full border border-brand-primary/20 px-4 py-2 text-sm font-semibold text-brand-dark transition hover:border-brand-primary hover:bg-brand-primary hover:text-white"
            >
              Cart ({cartCount})
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className="rounded-full bg-brand-secondary px-4 py-2 text-sm font-semibold text-brand-dark transition hover:bg-brand-accent"
                >
                  {user?.name?.split(" ")[0] ?? "Profile"}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-brand-dark/10 px-4 py-2 text-sm font-semibold text-brand-dark transition hover:border-brand-primary hover:text-brand-primary"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
              >
                Login
              </Link>
            )}
          </div>

          <button
            type="button"
            className="inline-flex rounded-full border border-brand-primary/20 p-3 text-brand-dark lg:hidden"
            onClick={() => setIsOpen((open) => !open)}
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="flex flex-col gap-1">
              <span className="h-0.5 w-5 bg-current" />
              <span className="h-0.5 w-5 bg-current" />
              <span className="h-0.5 w-5 bg-current" />
            </span>
          </button>
        </div>

        {isOpen && (
          <div className="space-y-3 border-t border-brand-primary/10 pb-5 pt-4 lg:hidden">
            {mainLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className="block rounded-2xl bg-brand-secondary px-4 py-3 text-sm font-semibold text-brand-dark"
              >
                {link.label}
              </NavLink>
            ))}
            <Link
              to="/cart"
              onClick={() => setIsOpen(false)}
              className="block rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-brand-dark"
            >
              Cart ({cartCount})
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-brand-dark"
                >
                  Profile
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="block w-full rounded-2xl bg-brand-primary px-4 py-3 text-left text-sm font-semibold text-white"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsOpen(false)}
                className="block rounded-2xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white"
              >
                Login
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
