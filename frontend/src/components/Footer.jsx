import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";

function Footer() {
  const handleFooterNavigation = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  return (
    <footer id="footer" className="mt-16 bg-black text-white">
      <div className="container-shell py-14">
        <div className="flex justify-center">
          <BrandLogo tone="light" className="max-w-[180px] sm:max-w-[230px]" />
        </div>

        <div className="mt-12 grid gap-10 border-t border-white/10 pt-10 md:grid-cols-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
              Quick Links
            </p>
            <Link className="block text-sm text-white/70 transition hover:text-white" to="/" onClick={handleFooterNavigation}>
              Home
            </Link>
            <Link className="block text-sm text-white/70 transition hover:text-white" to="/shop" onClick={handleFooterNavigation}>
              Shop
            </Link>
            <Link className="block text-sm text-white/70 transition hover:text-white" to="/about-us" onClick={handleFooterNavigation}>
              Our Story
            </Link>
            <Link className="block text-sm text-white/70 transition hover:text-white" to="/contact" onClick={handleFooterNavigation}>
              Contact
            </Link>
            <Link className="block text-sm text-white/70 transition hover:text-white" to="/orders" onClick={handleFooterNavigation}>
              Track Order
            </Link>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
              Customer Care
            </p>
            <p className="text-sm text-white/70">Returns & Cancellation</p>
            <Link className="block text-sm text-white/70 transition hover:text-white" to="/privacy-policy" onClick={handleFooterNavigation}>
              Privacy Policy
            </Link>
            <Link className="block text-sm text-white/70 transition hover:text-white" to="/terms-and-conditions" onClick={handleFooterNavigation}>
              Terms & Conditions
            </Link>
            <Link className="block text-sm text-white/70 transition hover:text-white" to="/faq" onClick={handleFooterNavigation}>
              FAQ
            </Link>
            <Link className="block text-sm text-white/70 transition hover:text-white" to="/candle-fixes" onClick={handleFooterNavigation}>
              Candle Fixes
            </Link>
            <p className="text-sm text-white/70">Shipping & Delivery</p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
              Categories
            </p>
            <Link className="block text-sm text-white/70 transition hover:text-white" to="/shop" onClick={handleFooterNavigation}>
              All Products
            </Link>
            <p className="text-sm text-white/70">Flower Candles</p>
            <p className="text-sm text-white/70">Glass Candles</p>
            <p className="text-sm text-white/70">Candle Sets</p>
            <p className="text-sm text-white/70">Textured Candles</p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
              Follow Us
            </p>
            <p className="text-sm text-white/70">Facebook</p>
            <p className="text-sm text-white/70">Instagram</p>
            <p className="text-sm text-white/70">LinkedIn</p>
            <p className="text-sm text-white/70">WhatsApp</p>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/45">
          Copyright (c) 2026 CandleOra, Inc.
        </div>
      </div>
    </footer>
  );
}

export default Footer;
