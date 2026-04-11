import PropTypes from "prop-types";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import fallbackProductImage from "../assets/designer/image-optimized.webp";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { formatCurrency } from "../utils/format";
import { applyImageFallback, getResponsiveImageProps } from "../utils/images";
import { getProductPath, normalizeProduct } from "../utils/normalize";

function HeartIcon({ filled = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2.1"
    >
      <path
        d="M12 20.5L4.8 13.6C2.8 11.6 2.7 8.4 4.5 6.5C6.2 4.8 9 4.8 10.8 6.4L12 7.5L13.2 6.4C15 4.8 17.8 4.8 19.5 6.5C21.3 8.4 21.2 11.6 19.2 13.6L12 20.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarRow() {
  return (
    <div className="flex items-center justify-center gap-0.5 text-[#f3b33d]">
      {Array.from({ length: 5 }).map((_, index) => (
        <svg key={index} viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current">
          <path d="M12 2.8L14.8 8.5L21 9.4L16.5 13.8L17.6 20L12 17L6.4 20L7.5 13.8L3 9.4L9.2 8.5L12 2.8Z" />
        </svg>
      ))}
    </div>
  );
}

function CartIcon({ variant = "add" }) {
  if (variant === "added") {
    return (
      <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M8.5 12.2L10.8 14.5L15.8 9.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (variant === "remove") {
    return (
      <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M8.5 12H15.5" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8.5V15.5" strokeLinecap="round" />
      <path d="M8.5 12H15.5" strokeLinecap="round" />
    </svg>
  );
}

function ProductCard({ product, badgeLabel = null, priority = false }) {
  const { addToCart, removeFromCart, items: cartItems } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const prefersReducedMotion = useReducedMotion();
  const item = normalizeProduct(product);
  const wishlisted = isWishlisted(item.id);
  const cartEntry = cartItems.find(
    (cartItem) => Number(cartItem.productId ?? cartItem.id) === Number(item.id),
  );
  const isInCart = Boolean(cartEntry);
  const activeBadge = badgeLabel ?? (item.discount > 0 ? `-${item.discount}%` : null);
  const isNewBadge = activeBadge?.toUpperCase() === "NEW";
  const productPath = getProductPath(item);
  const cartButtonLabel =
    item.stock > 0
      ? isInCart
        ? "Added to Cart"
        : "Add to Cart"
      : "Out of Stock";
  const cartButtonIcon = isInCart ? "added" : "add";
  const cartButtonClasses =
    item.stock <= 0
      ? "cursor-not-allowed bg-black/12 text-black/45"
      : isInCart
        ? "bg-[#058b1f] text-white"
        : "bg-brand-primary text-black";
  const cardImage = getResponsiveImageProps(item.imageUrls[0], {
    widths: [240, 320, 480],
    quality: 68,
    sizes: "(min-width: 1280px) 250px, (min-width: 768px) 50vw, 100vw",
  });

  return (
    <article
      className={`group mx-auto w-full max-w-[250px] transition duration-300 hover:-translate-y-1 ${
        item.stock <= 0 ? "opacity-60" : ""
      }`}
    >
      <div className="relative h-[314px] w-full overflow-hidden rounded-[14px] bg-[#d0d0d0]">
        <Link to={productPath} className="block h-full w-full">
          <img
            src={cardImage.src}
            srcSet={cardImage.srcSet}
            sizes={cardImage.sizes}
            alt={item.name}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : undefined}
            onError={(event) => applyImageFallback(event, fallbackProductImage)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
          {activeBadge && (
            <span
              className={`absolute left-2.5 top-2.5 inline-flex min-h-[22px] min-w-[42px] items-center justify-center rounded-[8px] px-2 text-[11px] font-semibold leading-none text-white ${
                isNewBadge ? "bg-[#ff0000]" : "bg-black"
              }`}
            >
              {activeBadge}
            </span>
          )}
        </Link>
        <m.button
          type="button"
          title={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleWishlist(item);
          }}
          whileTap={prefersReducedMotion ? undefined : { scale: 0.88 }}
          className={`absolute right-2.5 top-2.5 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full transition ${
            wishlisted
              ? "bg-white/92 text-danger shadow-[0_8px_18px_rgba(0,0,0,0.18)]"
              : "bg-white/78 text-[#e04646] shadow-[0_8px_18px_rgba(0,0,0,0.16)] hover:bg-white/92 hover:text-[#d63d3d]"
          }`}
        >
          <m.span
            key={wishlisted ? "wishlisted" : "not-wishlisted"}
            initial={prefersReducedMotion ? false : { scale: 0.82, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <HeartIcon filled={wishlisted} />
          </m.span>
        </m.button>
      </div>

      <div className="space-y-[2px] pt-1.5 text-center">
        <Link to={productPath} className="group/title block">
          <h3 className="line-clamp-1 min-h-[22px] font-sans text-[15px] font-medium leading-[1.15] text-black transition group-hover/title:underline group-hover/title:underline-offset-4">
            {item.name}
          </h3>
        </Link>

        <div className="flex items-center justify-center gap-1.5 text-[15px] leading-none">
          {item.originalPrice > item.price && (
            <span className="text-black/35 line-through">
              {formatCurrency(item.originalPrice)}
            </span>
          )}
          <span className="font-semibold text-black">{formatCurrency(item.price)}</span>
        </div>

        <div className="flex items-center justify-center gap-1">
          <StarRow />
          <span className="text-[12px] text-black/55">({Math.max(1, Math.round(item.rating))})</span>
        </div>

        <m.button
          type="button"
          className={`mt-1 inline-flex h-[36px] w-full items-center justify-center overflow-hidden rounded-[8px] px-4 text-[13px] font-semibold transition-[background-color,color] duration-180 ease-[cubic-bezier(0.22,1,0.36,1)] ${cartButtonClasses}`}
          disabled={item.stock <= 0}
          whileTap={prefersReducedMotion || item.stock <= 0 ? undefined : { scale: 0.98 }}
          onClick={() => {
            if (isInCart && cartEntry) {
              removeFromCart(cartEntry.id);
              return;
            }

            addToCart(item, 1);
          }}
          title={cartButtonLabel}
          aria-label={cartButtonLabel}
        >
          <span className="relative flex h-full w-full items-center justify-center">
            <AnimatePresence initial={false}>
              <m.span
                key={cartButtonLabel}
                initial={prefersReducedMotion ? false : { y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { y: -8, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 inline-flex items-center justify-center gap-2 tracking-[0.01em]"
              >
                {item.stock > 0 ? <CartIcon variant={cartButtonIcon} /> : null}
                <span>{cartButtonLabel}</span>
              </m.span>
            </AnimatePresence>
          </span>
        </m.button>
      </div>
    </article>
  );
}

ProductCard.propTypes = {
  badgeLabel: PropTypes.string,
  priority: PropTypes.bool,
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    name: PropTypes.string.isRequired,
    slug: PropTypes.string,
    description: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    discount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    stock: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    occasionTag: PropTypes.string,
    imageUrl: PropTypes.string,
    imageUrls: PropTypes.arrayOf(PropTypes.string),
    rating: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    category: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      name: PropTypes.string,
      slug: PropTypes.string,
    }),
  }).isRequired,
};

export default ProductCard;
