import { Link } from "react-router-dom";
import { FOOTER_CATEGORIES } from "../constants/categories";
import whatsappFooterIcon from "../assets/whatsapp-footer.svg";
import BrandLogo from "./BrandLogo";

const whatsappMessage = encodeURIComponent(
  "Hello CandleOra, I would like to know more about your candles and current availability.",
);
const whatsappHref = `https://wa.me/918999908639?text=${whatsappMessage}`;
const instagramHref = "https://instagram.com";
const facebookHref = "https://facebook.com";

function FooterLink({ to, children, onClick }) {
  return (
    <Link
      className="block text-[15px] leading-7 text-white/78 transition hover:text-white"
      to={to}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

function FooterExternalLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="block text-[15px] leading-7 text-white/78 transition hover:text-white"
    >
      {children}
    </a>
  );
}

function FooterHeading({ children }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/48">
      {children}
    </p>
  );
}

function FooterContactRow({ title, href, children }) {
  const content = (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/42">{title}</p>
      <p className="text-[15px] leading-6 text-white/82">{children}</p>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <a href={href} className="block transition hover:opacity-100 hover:text-white">
      {content}
    </a>
  );
}

function Footer() {
  const handleFooterNavigation = () => {
    if (
      typeof window === "undefined" ||
      typeof window.scrollTo !== "function" ||
      (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent))
    ) {
      return;
    }

    try {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    } catch {
      // Ignore jsdom's unimplemented scrollTo during tests.
    }
  };

  return (
    <footer id="footer" className="mt-14 bg-black text-white">
      <div className="relative w-full bg-black">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col px-6 pb-4 pt-8 sm:px-8 lg:px-10 lg:pt-9">
          <div className="grid gap-8 border-b border-white/12 pb-8 lg:grid-cols-[1.35fr_0.82fr_0.92fr_0.86fr_0.72fr] lg:items-start lg:gap-x-8 xl:gap-x-10">
            <div className="space-y-5">
              <BrandLogo
                tone="light"
                className="max-w-[150px] sm:max-w-[165px] lg:max-w-[180px]"
              />

              <p className="max-w-[360px] text-[15px] leading-7 text-white/66">
                Handmade candles for warm homes, thoughtful gifting, and quiet little rituals that
                make a room feel finished.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <FooterContactRow title="Phone" href="tel:+918999908639">
                  +91 89999 08639
                </FooterContactRow>
                <FooterContactRow title="Email" href="mailto:candleora25@gmail.com">
                  candleora25@gmail.com
                </FooterContactRow>
                <FooterContactRow title="Location">
                  Nagpur, Maharashtra, India
                </FooterContactRow>
                <FooterContactRow title="Availability" href={whatsappHref}>
                  WhatsApp support available
                </FooterContactRow>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  to="/contact"
                  onClick={handleFooterNavigation}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/16 px-5 text-sm font-semibold text-white transition hover:border-white/28 hover:bg-white/6"
                >
                  Contact Us
                </Link>
                <Link
                  to="/track"
                  onClick={handleFooterNavigation}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-brand-primary px-5 text-sm font-semibold text-black transition hover:brightness-105"
                >
                  Track Order
                </Link>
              </div>
            </div>

            <div className="space-y-3 lg:pl-5 xl:pl-7">
              <FooterHeading>Quick Links</FooterHeading>
              <FooterLink to="/" onClick={handleFooterNavigation}>Home</FooterLink>
              <FooterLink to="/shop" onClick={handleFooterNavigation}>Shop</FooterLink>
              <FooterLink to="/about-us" onClick={handleFooterNavigation}>Our Story</FooterLink>
              <FooterLink to="/contact" onClick={handleFooterNavigation}>Contact</FooterLink>
              <FooterLink to="/track" onClick={handleFooterNavigation}>Track Order</FooterLink>
              <FooterLink to="/wishlist" onClick={handleFooterNavigation}>Wishlist</FooterLink>
            </div>

            <div className="space-y-3">
              <FooterHeading>Customer Care</FooterHeading>
              <p className="text-[15px] leading-7 text-white/78">Returns & Cancellation</p>
              <FooterLink to="/privacy-policy" onClick={handleFooterNavigation}>Privacy Policy</FooterLink>
              <FooterLink to="/terms-and-conditions" onClick={handleFooterNavigation}>Terms & Conditions</FooterLink>
              <FooterLink to="/faq" onClick={handleFooterNavigation}>FAQ</FooterLink>
              <p className="text-[15px] leading-7 text-white/78">Shipping & Delivery</p>
            </div>

            <div className="space-y-3">
              <FooterHeading>Categories</FooterHeading>
              {FOOTER_CATEGORIES.map((category) => (
                <FooterLink
                  key={category.slug || "all"}
                  to={category.to}
                  onClick={handleFooterNavigation}
                >
                  {category.footerLabel}
                </FooterLink>
              ))}
            </div>

            <div className="space-y-3">
              <FooterHeading>Follow Us</FooterHeading>
              <FooterExternalLink href={instagramHref}>Instagram</FooterExternalLink>
              <FooterExternalLink href={whatsappHref}>WhatsApp</FooterExternalLink>
              <FooterExternalLink href={facebookHref}>Facebook</FooterExternalLink>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/12 pt-4 text-[13px] text-white/54 sm:flex-row sm:items-center sm:justify-between">
            <p>Copyright {"\u00A9"} 2025 CandleOra, Inc</p>
            <p className="text-white/42">Handmade candles, warm gifting, and thoughtful details.</p>
          </div>
        </div>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat with CandleOra on WhatsApp"
          className="absolute bottom-[26px] right-3 inline-flex h-[56px] w-[56px] items-center justify-center rounded-full transition duration-300 hover:-translate-y-1 sm:right-4 sm:h-[60px] sm:w-[60px] lg:bottom-[36px] lg:right-[22px]"
        >
          <img
            src={whatsappFooterIcon}
            alt=""
            aria-hidden="true"
            className="h-full w-full object-contain drop-shadow-[0_14px_28px_rgba(37,211,102,0.32)]"
          />
        </a>
      </div>
    </footer>
  );
}

export default Footer;
