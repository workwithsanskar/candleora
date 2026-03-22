import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import { useWishlist } from "../context/WishlistContext";
import { formatCurrency } from "../utils/format";
import BrandLogo from "./BrandLogo";

const desktopLinks = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "About Us", to: "/about-us" },
  { label: "Contact", to: "/contact" },
  { label: "Orders", to: "/orders" },
];

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 12C14.4853 12 16.5 9.98528 16.5 7.5C16.5 5.01472 14.4853 3 12 3C9.51472 3 7.5 5.01472 7.5 7.5C7.5 9.98528 9.51472 12 12 12Z" />
      <path d="M4.5 20.2C5.8 16.9 8.5 15.3 12 15.3C15.5 15.3 18.2 16.9 19.5 20.2" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7">
      <path
        d="M12 20.5L4.8 13.6C2.8 11.6 2.7 8.4 4.5 6.5C6.2 4.8 9 4.8 10.8 6.4L12 7.5L13.2 6.4C15 4.8 17.8 4.8 19.5 6.5C21.3 8.4 21.2 11.6 19.2 13.6L12 20.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M7.5 7H19L17.8 18H8.6L7.5 7Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 7A3 3 0 0 1 15 7" strokeLinecap="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5V5" strokeLinecap="round" />
      <path d="M12 19V21.5" strokeLinecap="round" />
      <path d="M4.9 4.9L6.7 6.7" strokeLinecap="round" />
      <path d="M17.3 17.3L19.1 19.1" strokeLinecap="round" />
      <path d="M2.5 12H5" strokeLinecap="round" />
      <path d="M19 12H21.5" strokeLinecap="round" />
      <path d="M4.9 19.1L6.7 17.3" strokeLinecap="round" />
      <path d="M17.3 6.7L19.1 4.9" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path
        d="M19 14.8C17.9 15.3 16.7 15.6 15.4 15.6C10.8 15.6 7.1 11.9 7.1 7.3C7.1 5.9 7.4 4.6 8 3.5C4.7 4.8 2.4 8 2.4 11.7C2.4 16.6 6.4 20.6 11.3 20.6C15 20.6 18.1 18.3 19.4 15C19.5 14.7 19.3 14.6 19 14.8Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconButton({ onClick, label, children, badge, active = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`relative inline-flex h-8 w-8 items-center justify-center transition ${
        active ? "text-brand-primary" : "text-brand-dark hover:text-brand-primary"
      }`}
    >
      {children}
      {badge > 0 && (
        <span className="absolute -right-1.5 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-brand-primary px-1 text-[9px] font-bold leading-none text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

function QuickPanel({ title, children }) {
  return (
    <div className="absolute right-0 top-[calc(100%+18px)] z-50 w-[350px] rounded-[24px] border border-[#e7ddd2] bg-white p-6 shadow-[0_28px_70px_rgba(25,18,14,0.22)]">
      <div className="mb-5 border-b border-[#f1e8df] pb-4">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.18em] text-brand-dark">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activePanel, setActivePanel] = useState(null);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const { items: cartItems, cartCount, grandTotal } = useCart();
  const { isDark, toggleTheme } = useTheme();
  const {
    items: wishlistItems,
    wishlistCount,
    removeFromWishlist,
  } = useWishlist();

  useEffect(() => {
    if (!activePanel) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!panelRef.current?.contains(event.target)) {
        setActivePanel(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setActivePanel(null);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [activePanel]);

  const closeMenus = () => {
    setIsOpen(false);
    setActivePanel(null);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmedSearch = search.trim();
    navigate(trimmedSearch ? `/shop?search=${encodeURIComponent(trimmedSearch)}` : "/shop");
    closeMenus();
  };

  const previewCartItems = cartItems.slice(0, 3);
  const previewWishlistItems = wishlistItems.slice(0, 3);

  return (
    <header className="sticky top-0 z-50 border-b border-[#ece7e2] bg-white/95 backdrop-blur-md transition-colors duration-300 dark:border-[#4e3d32] dark:bg-[#120f0d]/95">
      <div className="container-shell">
        <div className="flex min-h-[74px] items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <Link to="/" className="shrink-0" onClick={closeMenus}>
              <BrandLogo
                compact
                className="max-w-[108px] sm:max-w-[140px]"
                showTagline
                tone={isDark ? "light" : "dark"}
              />
            </Link>
          </div>

          <form
            onSubmit={handleSearchSubmit}
            className="hidden min-w-0 flex-1 items-center justify-end lg:flex"
          >
            <label className="flex w-full max-w-[330px] items-center gap-2 rounded-full border border-[#bcb6af] bg-white px-4 py-2 text-[11px] text-brand-dark/60 transition-colors duration-300 dark:border-[#6f5b4d] dark:bg-[#1a1411]">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-brand-muted" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="6.5" />
                <path d="M16 16L21 21" strokeLinecap="round" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="What are you looking for?"
                className="w-full bg-transparent text-[11px] text-brand-dark outline-none placeholder:text-brand-muted/70"
              />
            </label>
          </form>

          <div ref={panelRef} className="relative hidden items-center gap-3 pl-5 md:flex">
            <IconButton
              label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              active={isDark}
              onClick={toggleTheme}
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </IconButton>

            <IconButton
              label={isAuthenticated ? "Account" : "Login or signup"}
              active={activePanel === "account"}
              onClick={() =>
                setActivePanel((current) => (current === "account" ? null : "account"))
              }
            >
              <UserIcon />
            </IconButton>

            <IconButton
              label="Wishlist"
              badge={wishlistCount}
              active={activePanel === "wishlist"}
              onClick={() =>
                setActivePanel((current) => (current === "wishlist" ? null : "wishlist"))
              }
            >
              <HeartIcon filled={activePanel === "wishlist"} />
            </IconButton>

            <IconButton
              label="Cart"
              badge={cartCount}
              active={activePanel === "cart"}
              onClick={() =>
                setActivePanel((current) => (current === "cart" ? null : "cart"))
              }
            >
              <BagIcon />
            </IconButton>

            {activePanel === "account" && (
              <QuickPanel title="My Account">
                {isAuthenticated ? (
                  <div className="space-y-5">
                    <div>
                      <p className="text-xl font-semibold text-brand-dark">
                        {user?.name ?? "CandleOra Customer"}
                      </p>
                      <p className="mt-1 text-sm text-brand-dark/60">
                        {user?.email ?? "Your profile is ready."}
                      </p>
                    </div>

                    <div className="grid gap-3">
                      <Link
                        to="/profile"
                        onClick={closeMenus}
                        className="rounded-[14px] border border-[#e8ddd1] px-4 py-3 text-sm font-semibold text-brand-dark transition hover:border-brand-primary hover:text-brand-primary"
                      >
                        My Account
                      </Link>
                      <Link
                        to="/orders"
                        onClick={closeMenus}
                        className="rounded-[14px] border border-[#e8ddd1] px-4 py-3 text-sm font-semibold text-brand-dark transition hover:border-brand-primary hover:text-brand-primary"
                      >
                        My Orders
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          closeMenus();
                        }}
                        className="rounded-[14px] bg-brand-dark px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <p className="text-sm leading-7 text-brand-dark/65">
                      Login to access your account, orders, checkout details, and saved products.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        to="/login"
                        onClick={closeMenus}
                        className="rounded-[14px] border border-brand-dark px-4 py-3 text-center text-sm font-semibold text-brand-dark transition hover:bg-brand-dark hover:text-white"
                      >
                        Login
                      </Link>
                      <Link
                        to="/signup"
                        onClick={closeMenus}
                        className="rounded-[14px] border border-brand-dark px-4 py-3 text-center text-sm font-semibold text-brand-dark transition hover:bg-brand-dark hover:text-white"
                      >
                        Signup
                      </Link>
                    </div>
                  </div>
                )}
              </QuickPanel>
            )}

            {activePanel === "wishlist" && (
              <QuickPanel title="Wishlist">
                {previewWishlistItems.length ? (
                  <div className="space-y-5">
                    <div className="space-y-4">
                      {previewWishlistItems.map((item) => (
                        <article
                          key={item.id}
                          className="grid grid-cols-[64px_1fr_auto] items-center gap-3"
                        >
                          <Link to={`/product/${item.id}`} onClick={closeMenus}>
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-16 w-16 rounded-[14px] object-cover"
                            />
                          </Link>
                          <div className="min-w-0">
                            <Link
                              to={`/product/${item.id}`}
                              onClick={closeMenus}
                              className="block truncate text-sm font-semibold text-brand-dark"
                            >
                              {item.name}
                            </Link>
                            <p className="mt-1 text-xs text-brand-dark/55">
                              {item.category?.name ?? "Candles"}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-brand-dark">
                              {formatCurrency(item.price)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromWishlist(item.id)}
                            className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-primary"
                          >
                            Remove
                          </button>
                        </article>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        to="/wishlist"
                        onClick={closeMenus}
                        className="rounded-[14px] border border-[#e8ddd1] px-4 py-3 text-center text-sm font-semibold text-brand-dark transition hover:border-brand-primary hover:text-brand-primary"
                      >
                        View Wishlist
                      </Link>
                      <Link
                        to="/shop"
                        onClick={closeMenus}
                        className="rounded-[14px] bg-brand-dark px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-primary"
                      >
                        Shop More
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <p className="text-sm leading-7 text-brand-dark/65">
                      Save candles you love and revisit them when you are ready to place your order.
                    </p>
                    <Link
                      to="/shop"
                      onClick={closeMenus}
                      className="block rounded-[14px] bg-brand-dark px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-primary"
                    >
                      Explore Products
                    </Link>
                  </div>
                )}
              </QuickPanel>
            )}

            {activePanel === "cart" && (
              <QuickPanel title="Shopping Cart">
                {previewCartItems.length ? (
                  <div className="space-y-5">
                    <div className="space-y-4">
                      {previewCartItems.map((item) => (
                        <article
                          key={item.id}
                          className="grid grid-cols-[64px_1fr_auto] items-center gap-3"
                        >
                          <Link to="/cart" onClick={closeMenus}>
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="h-16 w-16 rounded-[14px] object-cover"
                            />
                          </Link>
                          <div className="min-w-0">
                            <Link
                              to="/cart"
                              onClick={closeMenus}
                              className="block truncate text-sm font-semibold text-brand-dark"
                            >
                              {item.productName}
                            </Link>
                            <p className="mt-1 text-xs text-brand-dark/55">
                              Qty {item.quantity}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-brand-dark">
                              {formatCurrency(item.lineTotal)}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>

                    <div className="rounded-[18px] bg-[#faf5ef] px-4 py-3">
                      <div className="flex items-center justify-between text-sm font-semibold text-brand-dark">
                        <span>Subtotal</span>
                        <span>{formatCurrency(grandTotal)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        to="/cart"
                        onClick={closeMenus}
                        className="rounded-[14px] border border-[#e8ddd1] px-4 py-3 text-center text-sm font-semibold text-brand-dark transition hover:border-brand-primary hover:text-brand-primary"
                      >
                        View Cart
                      </Link>
                      <Link
                        to={isAuthenticated ? "/checkout" : "/login"}
                        state={isAuthenticated ? undefined : { from: { pathname: "/checkout" } }}
                        onClick={closeMenus}
                        className="rounded-[14px] bg-brand-dark px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-primary"
                      >
                        {isAuthenticated ? "Checkout" : "Sign In"}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <p className="text-sm leading-7 text-brand-dark/65">
                      Your shopping cart is empty. Add a few CandleOra favorites and come back here
                      to check out.
                    </p>
                    <Link
                      to="/shop"
                      onClick={closeMenus}
                      className="block rounded-[14px] bg-brand-dark px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-primary"
                    >
                      Start Shopping
                    </Link>
                  </div>
                )}
              </QuickPanel>
            )}
          </div>

          <button
            type="button"
            className="inline-flex rounded-full border border-[#d7d0c8] p-3 text-brand-dark transition-colors duration-300 dark:border-[#5d4a3f] md:hidden"
            onClick={() => {
              setIsOpen((open) => !open);
              setActivePanel(null);
            }}
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="flex flex-col gap-1">
              <span className="h-0.5 w-5 bg-current" />
              <span className="h-0.5 w-5 bg-current" />
              <span className="h-0.5 w-5 bg-current" />
            </span>
          </button>
        </div>

        <div className="hidden h-10 items-center justify-center border-t border-[#efebe6] transition-colors duration-300 dark:border-[#44342b] md:flex">
          <nav className="flex flex-wrap items-center gap-12">
            {desktopLinks.map((link) =>
              link.to ? (
                <NavLink
                  key={link.label}
                  to={link.to}
                  className={({ isActive }) =>
                    `text-[12px] font-semibold uppercase tracking-[0.08em] transition ${
                      isActive ? "text-brand-dark" : "text-brand-dark/70 hover:text-brand-dark"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-[12px] font-semibold uppercase tracking-[0.08em] text-brand-dark/70 transition hover:text-brand-dark"
                >
                  {link.label}
                </a>
              )
            )}
          </nav>
        </div>

        {isOpen && (
          <div className="border-t border-[#f0e7de] py-4 transition-colors duration-300 dark:border-[#4b3a30] md:hidden">
            <div className="space-y-3 rounded-[24px] border border-[#eee3d8] bg-white p-4 transition-colors duration-300 dark:border-[#5b473b] dark:bg-[#191310]">
              <form onSubmit={handleSearchSubmit}>
                <label className="flex items-center gap-3 rounded-full border border-[#e7ddd2] bg-[#faf7f3] px-4 py-3 transition-colors duration-300 dark:border-[#5b473b] dark:bg-[#241c17]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand-muted" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="11" cy="11" r="6.5" />
                    <path d="M16 16L21 21" strokeLinecap="round" />
                  </svg>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search candles..."
                    className="w-full bg-transparent text-sm text-brand-dark outline-none"
                  />
                </label>
              </form>

              {desktopLinks.map((link) =>
                link.to ? (
                  <NavLink
                    key={link.label}
                    to={link.to}
                    onClick={closeMenus}
                    className={({ isActive }) =>
                      `block rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        isActive ? "bg-brand-primary text-white" : "bg-[#faf7f3] text-brand-dark"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={closeMenus}
                    className="block rounded-2xl bg-[#faf7f3] px-4 py-3 text-sm font-semibold text-brand-dark"
                  >
                    {link.label}
                  </a>
                )
              )}

              <button
                type="button"
                onClick={toggleTheme}
                className="block w-full rounded-2xl bg-[#faf7f3] px-4 py-3 text-left text-sm font-semibold text-brand-dark transition-colors duration-300 dark:bg-[#241c17]"
              >
                {isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              </button>

              <Link
                to="/wishlist"
                onClick={closeMenus}
                className="block rounded-2xl bg-[#faf7f3] px-4 py-3 text-sm font-semibold text-brand-dark"
              >
                Wishlist ({wishlistCount})
              </Link>

              <Link
                to="/cart"
                onClick={closeMenus}
                className="block rounded-2xl bg-[#faf7f3] px-4 py-3 text-sm font-semibold text-brand-dark"
              >
                Cart ({cartCount})
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    onClick={closeMenus}
                    className="block rounded-2xl bg-[#faf7f3] px-4 py-3 text-sm font-semibold text-brand-dark"
                  >
                    My Account
                  </Link>
                  <Link
                    to="/orders"
                    onClick={closeMenus}
                    className="block rounded-2xl bg-[#faf7f3] px-4 py-3 text-sm font-semibold text-brand-dark"
                  >
                    Orders
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      closeMenus();
                    }}
                    className="w-full rounded-2xl bg-brand-dark px-4 py-3 text-left text-sm font-semibold text-white"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={closeMenus}
                    className="block rounded-2xl bg-brand-dark px-4 py-3 text-sm font-semibold text-white"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={closeMenus}
                    className="block rounded-2xl border border-brand-dark px-4 py-3 text-sm font-semibold text-brand-dark"
                  >
                    Signup
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
