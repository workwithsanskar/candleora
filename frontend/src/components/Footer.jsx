import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="relative border-t border-brand-primary/10 bg-brand-dark text-white">
      <div className="container-shell grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <p className="font-display text-3xl font-semibold">CandleOra</p>
          <p className="max-w-sm text-sm leading-7 text-white/75">
            Small-batch candles, occasion-ready gifting, and helpful candle care content in one warm storefront.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-accent">
            Shop
          </p>
          <Link className="block text-sm text-white/75 transition hover:text-white" to="/shop">
            All Products
          </Link>
          <Link
            className="block text-sm text-white/75 transition hover:text-white"
            to="/occasion-picks"
          >
            Occasion Picks
          </Link>
          <Link
            className="block text-sm text-white/75 transition hover:text-white"
            to="/cart"
          >
            Cart
          </Link>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-accent">
            Learn
          </p>
          <Link
            className="block text-sm text-white/75 transition hover:text-white"
            to="/styling-guides"
          >
            Styling Guides
          </Link>
          <Link
            className="block text-sm text-white/75 transition hover:text-white"
            to="/candle-fixes"
          >
            Candle Fixes
          </Link>
          <Link className="block text-sm text-white/75 transition hover:text-white" to="/faq">
            FAQ
          </Link>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-accent">
            Customer Care
          </p>
          <p className="text-sm text-white/75">hello@candleora.com</p>
          <p className="text-sm text-white/75">Mon-Sat, 10 AM to 7 PM</p>
          <p className="text-sm text-white/75">Instagram / Pinterest / YouTube</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
