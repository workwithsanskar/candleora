import { Link } from "react-router-dom";
import { FOOTER_CATEGORIES } from "../constants/categories";
import whatsappFooterIcon from "../assets/whatsapp-footer.svg";
import BrandLogo from "./BrandLogo";

const whatsappMessage = encodeURIComponent(
  "Hello CandleOra, I would like to know more about your candles and current availability.",
);
const whatsappHref = `https://wa.me/918999908639?text=${whatsappMessage}`;

function FooterLink({ to, children, onClick }) {
  return (
    <Link
      className="block text-[15px] leading-8 text-white/82 transition hover:text-white"
      to={to}
      onClick={onClick}
    >
      {children}
    </Link>
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
    <footer id="footer" className="mt-20 bg-black text-white">
      <div className="relative w-full bg-black">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col px-8 pb-5 pt-10 sm:px-10 sm:pt-12 lg:min-h-[682px] lg:px-[48px] lg:pt-[34px]">
          <div className="flex justify-center">
            <BrandLogo
              tone="light"
              className="max-w-[220px] sm:max-w-[280px] lg:max-w-[360px]"
            />
          </div>

          <div className="mt-8 flex-1 border-t border-white/12 pt-10 lg:mt-[42px] lg:pt-[44px]">
            <div className="grid gap-y-10 md:grid-cols-4 md:gap-x-8 lg:gap-x-12 xl:gap-x-16">
              <div className="space-y-3">
                <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-white/52">
                Quick Links
                </p>
                <FooterLink to="/" onClick={handleFooterNavigation}>Home</FooterLink>
                <FooterLink to="/shop" onClick={handleFooterNavigation}>Shop</FooterLink>
                <FooterLink to="/about-us" onClick={handleFooterNavigation}>Our Story</FooterLink>
                <FooterLink to="/contact" onClick={handleFooterNavigation}>Contact</FooterLink>
                <FooterLink to="/track" onClick={handleFooterNavigation}>Track Order</FooterLink>
              </div>

              <div className="space-y-3">
                <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-white/52">
                  Customer Care
                </p>
                <p className="text-[15px] leading-8 text-white/82">Returns & Cancellation</p>
                <FooterLink to="/privacy-policy" onClick={handleFooterNavigation}>Privacy Policy</FooterLink>
                <FooterLink to="/terms-and-conditions" onClick={handleFooterNavigation}>Terms & Conditions</FooterLink>
                <FooterLink to="/faq" onClick={handleFooterNavigation}>FAQ</FooterLink>
                <p className="text-[15px] leading-8 text-white/82">Shipping & Delivery</p>
              </div>

              <div className="space-y-3">
                <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-white/52">
                  Categories
                </p>
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
                <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-white/52">
                  Follow Us
                </p>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="block text-[15px] leading-8 text-white/82 transition hover:text-white"
                >
                  Instagram
                </a>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-[15px] leading-8 text-white/82 transition hover:text-white"
                >
                  WhatsApp
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="block text-[15px] leading-8 text-white/82 transition hover:text-white"
                >
                  Facebook
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-white/12 pt-5 text-center text-[14px] text-white/58">
            Copyright {"\u00A9"} 2025 CandleOra, Inc
          </div>
        </div>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          aria-label="Chat with CandleOra on WhatsApp"
          className="absolute bottom-[42px] right-3 inline-flex h-[60px] w-[60px] items-center justify-center rounded-full transition duration-300 hover:-translate-y-1 sm:right-4 sm:h-[64px] sm:w-[64px] lg:bottom-[56px] lg:right-[26px]"
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
