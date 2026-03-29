import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";

const whatsappMessage = encodeURIComponent(
  "Hello CandleOra, I would like to know more about your candles and current availability.",
);
const whatsappHref = `https://wa.me/918999908639?text=${whatsappMessage}`;
const instagramHref = "https://instagram.com";
const facebookHref = "https://facebook.com";

const footerStaticItemClassName =
  "block text-[17px] font-normal leading-[22px] text-white lg:whitespace-nowrap";
const footerInteractiveItemClassName =
  "group flex items-center text-[17px] font-normal leading-[22px] text-white transition-colors duration-200 hover:text-[#D6D6D6] lg:whitespace-nowrap";

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

function FooterExternalLink({ href, children }) {
  const isMailLink = href.startsWith("mailto:");
  const itemClassName = isMailLink
    ? "group flex items-center text-[15px] font-normal leading-[20px] text-[#BDBDBD] transition-colors duration-200 hover:text-white lg:whitespace-nowrap"
    : footerInteractiveItemClassName;

  return (
    <a
      href={href}
      target={isMailLink ? undefined : "_blank"}
      rel={isMailLink ? undefined : "noreferrer"}
      className={itemClassName}
    >
      <span className="transition-transform duration-200 group-hover:translate-x-[2px]">
        {children}
      </span>
    </a>
  );
}

function FooterHeading({ children }) {
  return (
    <p className="text-[17px] font-normal uppercase leading-[21px] tracking-normal text-[#9A9A9A]">
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
      <div className="w-full bg-[linear-gradient(180deg,#070707_0%,#000000_18%,#000000_100%)]">
        <div className="mx-auto w-full max-w-[1440px] px-6 py-10 sm:px-10 sm:py-12 lg:pl-[74px] lg:pr-[49px] lg:pt-[42px] lg:pb-[68px]">
          <div className="grid gap-y-10 lg:grid-cols-[190px_942px] lg:gap-x-[170px]">
            <div className="flex flex-col gap-7 lg:pt-[92px]">
              <BrandLogo tone="light" className="max-w-[190px]" imageClassName="opacity-95" />
              <p className="text-[15px] leading-[19px] text-[#676767] sm:text-[16px]">
                Copyright {"\u00A9"} 2025
                <br />
                candleora.in
              </p>
            </div>

            <div className="grid gap-y-8 sm:grid-cols-2 sm:gap-x-10 lg:flex lg:w-[942px] lg:gap-0 lg:items-start">
              <div className="lg:w-[108px]">
                <FooterHeading>Quick Links</FooterHeading>
                <div className="mt-[18px] space-y-[18px]">
                  {quickLinks.map((item) => (
                    <FooterLink key={item.to} to={item.to} onClick={handleFooterNavigation}>
                      {item.label}
                    </FooterLink>
                  ))}
                </div>
              </div>

              <div className="lg:ml-[102px] lg:w-[214px]">
                <FooterHeading>Customer Care</FooterHeading>
                <div className="mt-[18px] space-y-[18px]">
                  <p className={footerStaticItemClassName}>Returns & Cancellation</p>
                  <FooterLink to="/privacy-policy" onClick={handleFooterNavigation}>
                    Privacy Policy
                  </FooterLink>
                  <FooterLink to="/terms-and-conditions" onClick={handleFooterNavigation}>
                    Terms & Conditions
                  </FooterLink>
                  <FooterLink to="/faq" onClick={handleFooterNavigation}>
                    FAQ
                  </FooterLink>
                  <p className={footerStaticItemClassName}>Shipping & Delivery</p>
                </div>
              </div>

              <div className="lg:ml-[75px] lg:w-[130px]">
                <FooterHeading>Categories</FooterHeading>
                <div className="mt-[18px] space-y-[18px]">
                  {footerCategories.map((category) => (
                    <FooterLink
                      key={category.to}
                      to={category.to}
                      onClick={handleFooterNavigation}
                    >
                      {category.label}
                    </FooterLink>
                  ))}
                </div>
              </div>

              <div className="lg:ml-[123px] lg:w-[190px]">
                <FooterHeading>
                  For Inquiry &<br />
                  Bulk Order
                </FooterHeading>
                <div className="mt-[18px] space-y-[18px]">
                  <FooterExternalLink href={facebookHref}>Facebook</FooterExternalLink>
                  <FooterExternalLink href={instagramHref}>Instagram</FooterExternalLink>
                  <FooterExternalLink href={whatsappHref}>Whatsapp</FooterExternalLink>
                  <div className="pt-0.5">
                    <FooterExternalLink href="mailto:candleora25@gmail.com">
                      candleora25@gmail.com
                    </FooterExternalLink>
                  </div>
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
