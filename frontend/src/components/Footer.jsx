import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import gmailFooterIcon from "../assets/gmail-footer.png";
import instagramFooterIcon from "../assets/instagram-footer.png";
import whatsappFooterIcon from "../assets/whatsapp-footer.png";

const whatsappMessage = encodeURIComponent(
  "Hello CandleOra, I would like to know more about your candles and current availability.",
);
const whatsappHref = `https://wa.me/918999908639?text=${whatsappMessage}`;
const instagramHref = "https://instagram.com";
const emailHref = "mailto:candleora25@gmail.com";

const footerInteractiveItemClassName =
  "group flex items-center text-[15px] font-normal leading-7 text-white/88 transition-colors duration-200 hover:text-white lg:whitespace-nowrap";

const quickLinks = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/about-us", label: "Our Story" },
  { to: "/contact", label: "Contact" },
  { to: "/track", label: "Track Order" },
];

const footerCategories = [
  { to: "/shop", label: "All Products" },
  { to: "/shop?category=candle-sets", label: "Candle Sets" },
  { to: "/shop?category=glass", label: "Glass" },
  { to: "/shop?category=tea-light", label: "Tealights" },
  { to: "/shop?category=creation", label: "Creations" },
];

function FooterLink({ to, children, onClick }) {
  return (
    <Link className={footerInteractiveItemClassName} to={to} onClick={onClick}>
      <span className="transition-transform duration-200 group-hover:translate-x-[2px]">
        {children}
      </span>
    </Link>
  );
}

function FooterExternalLink({ href, children, iconOnly = false }) {
  const isMailLink = href.startsWith("mailto:");

  return (
    <a
      href={href}
      target={isMailLink ? undefined : "_blank"}
      rel={isMailLink ? undefined : "noreferrer"}
      className={
        iconOnly
          ? "inline-flex h-11 w-11 items-center justify-center rounded-full transition duration-200 hover:-translate-y-0.5 hover:bg-white/[0.04]"
          : footerInteractiveItemClassName
      }
    >
      {children}
    </a>
  );
}

function FooterHeading({ children }) {
  return (
    <p className="text-[14px] font-normal uppercase leading-5 tracking-[0.03em] text-[#9A9A9A]">
      {children}
    </p>
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
    <footer
      id="footer"
      className="border-t border-[#161616] bg-black text-white"
      style={{ fontFamily: '"Oxygen", "Segoe UI", sans-serif' }}
    >
      <div className="w-full bg-[linear-gradient(180deg,#050505_0%,#000000_22%,#000000_100%)]">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-10 sm:px-10 sm:py-12 lg:px-[72px] lg:py-[64px]">
          <div className="grid gap-y-10 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-x-20">
            <div className="flex flex-col justify-end lg:min-h-[250px]">
              <div className="flex w-fit flex-col items-center text-center">
                <BrandLogo tone="light" className="max-w-[190px]" imageClassName="opacity-100" />
                <p className="mt-10 text-[14px] leading-6 text-[#6A6A6A] sm:text-[15px]">
                  Copyright {"\u00A9"} 2026 candleora.in
                </p>
              </div>
            </div>

            <div className="grid gap-y-8 sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-[minmax(130px,1fr)_minmax(220px,1.18fr)_minmax(160px,1fr)_minmax(220px,0.9fr)] lg:gap-x-16">
              <div>
                <FooterHeading>Quick Links</FooterHeading>
                <div className="mt-8 space-y-3.5">
                  {quickLinks.map((item) => (
                    <FooterLink key={item.to} to={item.to} onClick={handleFooterNavigation}>
                      {item.label}
                    </FooterLink>
                  ))}
                </div>
              </div>

              <div>
                <FooterHeading>Customer Care</FooterHeading>
                <div className="mt-8 space-y-3.5">
                  <FooterLink to="/faq" onClick={handleFooterNavigation}>
                    Replacement & Cancellation
                  </FooterLink>
                  <FooterLink to="/privacy-policy" onClick={handleFooterNavigation}>
                    Privacy Policy
                  </FooterLink>
                  <FooterLink to="/terms-and-conditions" onClick={handleFooterNavigation}>
                    Terms & Conditions
                  </FooterLink>
                  <FooterLink to="/faq" onClick={handleFooterNavigation}>
                    FAQ
                  </FooterLink>
                  <FooterLink to="/faq" onClick={handleFooterNavigation}>
                    Shipping & Delivery
                  </FooterLink>
                </div>
              </div>

              <div>
                <FooterHeading>Categories</FooterHeading>
                <div className="mt-8 space-y-3.5">
                  {footerCategories.map((category) => (
                    <FooterLink key={category.to} to={category.to} onClick={handleFooterNavigation}>
                      {category.label}
                    </FooterLink>
                  ))}
                </div>
              </div>

              <div>
                <FooterHeading>For Inquiry & Bulk Order</FooterHeading>
                <div className="mt-8 flex items-center gap-6">
                  <FooterExternalLink href={instagramHref} iconOnly>
                    <span className="sr-only">Instagram</span>
                    <img
                      src={instagramFooterIcon}
                      alt=""
                      aria-hidden="true"
                      className="h-7.5 w-7.5 object-contain"
                    />
                  </FooterExternalLink>
                  <FooterExternalLink href={whatsappHref} iconOnly>
                    <span className="sr-only">WhatsApp</span>
                    <img
                      src={whatsappFooterIcon}
                      alt=""
                      aria-hidden="true"
                      className="h-7.5 w-7.5 object-contain"
                    />
                  </FooterExternalLink>
                  <FooterExternalLink href={emailHref} iconOnly>
                    <span className="sr-only">Email</span>
                    <img
                      src={gmailFooterIcon}
                      alt=""
                      aria-hidden="true"
                      className="h-7.5 w-7.5 object-contain"
                    />
                  </FooterExternalLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
