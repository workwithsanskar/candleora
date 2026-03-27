import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { formatCurrency } from "../utils/format";
import { getProductPath } from "../utils/normalize";
import BrandLogo from "./BrandLogo";
import Tooltip from "./Tooltip";

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

function BagIcon({ filled = false }) {
  return (
    <svg
      viewBox="0 0 18 20"
      className="h-[17px] w-[17px]"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
    >
      <path
        d="M9.00488 0.5C11.2573 0.5 13.133 2.15163 13.4551 4.32227L13.4746 4.79492L13.1924 5.42188L12.96 4.82031C12.9536 4.80373 12.9494 4.78528 12.9492 4.76758C12.9456 2.57545 11.1622 0.802772 8.96582 0.802734C6.76719 0.802734 4.98145 2.57915 4.98145 4.77441V4.81836L4.98926 4.86133C4.99228 4.87845 4.99228 4.89596 4.98926 4.91309L4.88574 5.5H14.0869C14.9716 5.5002 15.9993 6.06453 16.5088 7.66699L16.6035 8.00195L17.417 14.376C17.6811 16.2627 17.288 17.4995 16.5791 18.2744C15.9072 19.0088 14.8759 19.4123 13.6025 19.4873L13.3447 19.498H4.86816C3.40803 19.5 2.2407 19.2293 1.49316 18.5449C0.770179 17.8829 0.322746 16.721 0.56543 14.6465L0.600586 14.3789L1.37793 8.19043C1.55629 7.18601 1.93182 6.53132 2.36133 6.12402C2.79218 5.71559 3.30726 5.52729 3.81738 5.50293L3.94336 5.5H4.60547L4.50195 4.91309C4.49894 4.896 4.49895 4.87842 4.50195 4.86133L4.50781 4.82812L4.50977 4.79492C4.61049 2.39598 6.59156 0.500032 9.00488 0.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* optional inner details (dots) */}
      <path
        d="M11.8857 7.8291C11.108 7.82914 10.502 8.47445 10.502 9.23926C10.5021 10.0039 11.1082 10.6484 11.8857 10.6484C12.6634 10.6484 13.2694 10.004 13.2695 9.23926C13.2695 8.47442 12.6635 7.8291 11.8857 7.8291Z"
        fill={filled ? "currentColor" : "none"}
      />
      <path
        d="M6.09668 7.8291C5.31909 7.82928 4.71289 8.47453 4.71289 9.23926C4.71306 10.0038 5.31921 10.6483 6.09668 10.6484C6.87431 10.6484 7.4803 10.004 7.48047 9.23926C7.4803 8.47453 6.87409 7.8291 6.09668 7.8291Z"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}


function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16L21 21" strokeLinecap="round" />
    </svg>
  );
}

function IconButton({ onClick, label, children, badge, active = false, accent = false }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Tooltip content={label} position="bottom">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        title={label}
        className={`relative inline-flex h-9 w-9 items-center justify-center rounded-full transition ${
          accent
            ? "text-danger hover:bg-danger/10"
            : active
              ? "bg-brand-primary/12 text-black"
              : "text-black hover:bg-black/5"
        }`}
      >
        {children}
        <AnimatePresence initial={false}>
          {badge > 0 && (
            <m.span
              key={badge}
              initial={prefersReducedMotion ? false : { scale: 0.72, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { scale: 0.72, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -right-1 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-brand-primary px-1 text-[9px] font-bold leading-none text-white"
            >
              {badge}
            </m.span>
          )}
        </AnimatePresence>
      </button>
    </Tooltip>
  );
}

function QuickPanel({ title, children }) {
  return (
    <div className="absolute right-0 top-[calc(100%+16px)] z-50 w-[340px] rounded-[24px] border border-black/10 bg-white p-6 shadow-candle">
      <div className="mb-5 border-b border-black/8 pb-4">
        <h3 className="font-display text-[1.2rem] font-semibold text-black">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function DesktopNavLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `inline-flex h-full items-center border-b-2 py-4 text-base font-medium transition ${
          isActive
            ? "border-black text-black"
            : "border-transparent text-black/70 hover:border-black/30 hover:text-black"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activePanel, setActivePanel] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();
  const { items: cartItems, cartCount, grandTotal } = useCart();
  const { items: wishlistItems, wishlistCount, removeFromWishlist } = useWishlist();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 6);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const previewCartItems = useMemo(() => cartItems.slice(0, 3), [cartItems]);
  const previewWishlistItems = useMemo(() => wishlistItems.slice(0, 3), [wishlistItems]);

  return (
    <header
      className={`sticky top-0 z-50 border-b border-black/10 bg-white transition-shadow duration-300 ${
        isScrolled ? "shadow-[0_8px_24px_rgba(0,0,0,0.08)]" : ""
      }`}
    >
      <div className="container-shell">
        <div className="flex min-h-[80px] items-center justify-between gap-4">
          <Link to="/" className="shrink-0" onClick={closeMenus}>
            <BrandLogo compact showTagline className="max-w-[108px] sm:max-w-[148px]" tone="dark" />
          </Link>

          <form
            onSubmit={handleSearchSubmit}
            className="hidden min-w-0 flex-1 items-center justify-end lg:flex"
          >
            <label className="flex w-full max-w-[260px] items-center gap-2 rounded-full border border-black/20 bg-white px-4 py-2 text-sm text-black/65 transition focus-within:border-black">
              <SearchIcon />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="What are you looking for?"
                className="w-full bg-transparent text-sm text-black outline-none placeholder:text-black/35"
              />
            </label>
          </form>

          <div ref={panelRef} className="relative hidden items-center gap-2 md:flex">
            <IconButton
              label={isAuthenticated ? "Account" : "Login or signup"}
              active={activePanel === "account"}
              onClick={() => setActivePanel((current) => (current === "account" ? null : "account"))}
            >
              <UserIcon />
            </IconButton>

            <IconButton
              label="Wishlist"
              badge={wishlistCount}
              active={activePanel === "wishlist"}
              accent={activePanel === "wishlist"}
              onClick={() => setActivePanel((current) => (current === "wishlist" ? null : "wishlist"))}
            >
              <HeartIcon filled={activePanel === "wishlist"} />
            </IconButton>

            <IconButton
              label="Cart"
              badge={cartCount}
              active={activePanel === "cart"}
              onClick={() => setActivePanel((current) => (current === "cart" ? null : "cart"))}
            >
              <BagIcon />
            </IconButton>

            {activePanel === "account" && (
              <QuickPanel title="My Account">
                {isAuthenticated ? (
                  <div className="space-y-5">
                    <div>
                      <p className="font-display text-[1.5rem] font-semibold text-black">
                        {user?.name ?? "CandleOra Customer"}
                      </p>
                      <p className="mt-1 text-sm text-black/60">
                        {user?.email ?? "Your profile is ready."}
                      </p>
                    </div>

                    <div className="grid gap-3">
                      <Link
                        to="/profile"
                        onClick={closeMenus}
                        className="btn btn-outline"
                      >
                        My Account
                      </Link>
                      <Link
                        to="/orders"
                        onClick={closeMenus}
                        className="btn btn-outline"
                      >
                        My Orders
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          logout();
                          closeMenus();
                        }}
                        className="btn btn-secondary"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <p className="text-sm leading-7 text-black/65">
                      Login to access your account, orders, checkout details, and saved products.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        to="/login"
                        onClick={closeMenus}
                        className="btn btn-outline text-center"
                      >
                        Login
                      </Link>
                      <Link
                        to="/signup"
                        onClick={closeMenus}
                        className="btn btn-primary text-center"
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
                        <article key={item.id} className="grid grid-cols-[64px_1fr_auto] items-center gap-3">
                          <Link to={getProductPath(item)} onClick={closeMenus}>
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-16 w-16 rounded-[14px] object-cover"
                            />
                          </Link>
                          <div className="min-w-0">
                            <Link
                              to={getProductPath(item)}
                              onClick={closeMenus}
                              className="block truncate text-sm font-medium text-black"
                            >
                              {item.name}
                            </Link>
                            <p className="mt-1 text-xs text-black/55">
                              {item.category?.name ?? "Candles"}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-black">
                              {formatCurrency(item.price)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromWishlist(item.id)}
                            className="text-xs font-semibold uppercase tracking-[0.12em] text-danger"
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
                        className="btn btn-outline text-center"
                      >
                        View Wishlist
                      </Link>
                      <Link
                        to="/shop"
                        onClick={closeMenus}
                        className="btn btn-primary text-center"
                      >
                        Shop More
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <p className="text-sm leading-7 text-black/65">
                      Save candles you love and revisit them when you are ready to place your order.
                    </p>
                    <Link
                      to="/shop"
                      onClick={closeMenus}
                      className="btn btn-primary w-full text-center"
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
                        <article key={item.id} className="grid grid-cols-[64px_1fr_auto] items-center gap-3">
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
                              className="block truncate text-sm font-medium text-black"
                            >
                              {item.productName}
                            </Link>
                            <p className="mt-1 text-xs text-black/55">Qty {item.quantity}</p>
                            <p className="mt-1 text-sm font-semibold text-black">
                              {formatCurrency(item.lineTotal)}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>

                    <div className="rounded-[18px] bg-black/[0.03] px-4 py-3">
                      <div className="flex items-center justify-between text-sm font-semibold text-black">
                        <span>Subtotal</span>
                        <span>{formatCurrency(grandTotal)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        to="/cart"
                        onClick={closeMenus}
                        className="btn btn-outline text-center"
                      >
                        View Cart
                      </Link>
                      <Link
                        to={isAuthenticated ? "/checkout" : "/login"}
                        state={isAuthenticated ? undefined : { from: { pathname: "/checkout" } }}
                        onClick={closeMenus}
                        className="btn btn-primary text-center"
                      >
                        {isAuthenticated ? "Checkout" : "Sign In"}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <p className="text-sm leading-7 text-black/65">
                      Your shopping cart is empty. Add a few CandleOra favorites and come back here to check out.
                    </p>
                    <Link
                      to="/shop"
                      onClick={closeMenus}
                      className="btn btn-primary w-full text-center"
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
            className="inline-flex rounded-full border border-black/15 p-3 text-black transition hover:bg-black hover:text-white md:hidden"
            onClick={() => {
              setIsOpen((open) => !open);
              setActivePanel(null);
            }}
            aria-label="Toggle navigation"
            title="Menu"
          >
            <span className="flex flex-col gap-1">
              <span className="h-0.5 w-5 bg-current" />
              <span className="h-0.5 w-5 bg-current" />
              <span className="h-0.5 w-5 bg-current" />
            </span>
          </button>
        </div>

        <div className="hidden h-14 items-center justify-center border-t border-black/8 md:flex">
          <nav className="flex flex-wrap items-center gap-10">
            {desktopLinks.map((link) => (
              <DesktopNavLink key={link.label} to={link.to}>
                {link.label}
              </DesktopNavLink>
            ))}
          </nav>
        </div>

        {isOpen && (
          <div className="border-t border-black/8 py-4 md:hidden">
            <div className="space-y-3 rounded-[24px] border border-black/10 bg-white p-4 shadow-candle">
              <form onSubmit={handleSearchSubmit}>
                <label className="flex items-center gap-3 rounded-full border border-black/15 bg-white px-4 py-3">
                  <SearchIcon />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search candles..."
                    className="w-full bg-transparent text-sm text-black outline-none placeholder:text-black/35"
                  />
                </label>
              </form>

              {desktopLinks.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.to}
                  onClick={closeMenus}
                  className={({ isActive }) =>
                    `block rounded-2xl px-4 py-3 text-base font-medium transition ${
                      isActive ? "border border-black bg-black/[0.03] text-black" : "bg-black/[0.03] text-black"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}

              <Link
                to="/wishlist"
                onClick={closeMenus}
                className="block rounded-2xl bg-black/[0.03] px-4 py-3 text-sm font-medium text-black"
              >
                Wishlist ({wishlistCount})
              </Link>

              <Link
                to="/cart"
                onClick={closeMenus}
                className="block rounded-2xl bg-black/[0.03] px-4 py-3 text-sm font-medium text-black"
              >
                Cart ({cartCount})
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    onClick={closeMenus}
                    className="btn btn-outline w-full justify-start text-left"
                  >
                    My Account
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      closeMenus();
                    }}
                    className="btn btn-secondary w-full justify-start text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={closeMenus}
                    className="btn btn-secondary w-full justify-start text-left"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    onClick={closeMenus}
                    className="btn btn-primary w-full justify-start text-left"
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
