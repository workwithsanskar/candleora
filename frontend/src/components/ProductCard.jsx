import PropTypes from "prop-types";
import { m, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import fallbackProductImage from "../assets/designer/image-optimized.jpg";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { formatCurrency } from "../utils/format";
import { getProductPath, normalizeProduct } from "../utils/normalize";
import Tooltip from "./Tooltip";

function HeartIcon({ filled = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
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
        <svg key={index} viewBox="0 0 24 24" className="h-[21px] w-[21px] fill-current">
          <path d="M12 2.8L14.8 8.5L21 9.4L16.5 13.8L17.6 20L12 17L6.4 20L7.5 13.8L3 9.4L9.2 8.5L12 2.8Z" />
        </svg>
      ))}
    </div>
  );
}

function ProductCard({ product, badgeLabel = null }) {
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

  return (
    <article className="group mx-auto w-full max-w-[286px] transition duration-300 hover:-translate-y-1">
      <Link to={productPath} className="block">
        <div className="relative h-[360px] w-full overflow-hidden rounded-[14px] bg-[#d0d0d0]">
          <img
            src={item.imageUrls[0]}
            alt={item.name}
            loading="lazy"
            decoding="async"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = fallbackProductImage;
            }}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
          {activeBadge && (
            <span
              className={`absolute left-2.5 top-2.5 inline-flex min-h-[24px] min-w-[46px] items-center justify-center rounded-[8px] px-2.5 text-[12px] font-semibold leading-none text-white ${
                isNewBadge ? "bg-[#ff0000]" : "bg-black"
              }`}
            >
              {activeBadge}
            </span>
          )}
          <Tooltip
            content={wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
            className="absolute right-2.5 top-2.5 z-10"
          >
            <m.button
              type="button"
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              onClick={(event) => {
                event.preventDefault();
                toggleWishlist(item);
              }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.88 }}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/95 shadow-[0_8px_18px_rgba(0,0,0,0.16)] transition ${
                wishlisted ? "text-danger" : "text-black hover:text-danger"
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
          </Tooltip>
        </div>
      </Link>

      <div className="space-y-1 pt-1.5 text-center">
        <Link to={productPath}>
          <h3 className="line-clamp-2 min-h-[48px] font-heading text-[1.02rem] font-semibold leading-[1.18] text-black">
            {item.name}
          </h3>
        </Link>

        <div className="flex items-center justify-center gap-2 text-[16px] leading-none">
          {item.originalPrice > item.price && (
            <span className="text-black/35 line-through">
              {formatCurrency(item.originalPrice)}
            </span>
          )}
          <span className="font-semibold text-black">{formatCurrency(item.price)}</span>
        </div>

        <div className="flex items-center justify-center gap-1">
          <StarRow />
          <span className="text-xs text-black/55">({Math.max(1, Math.round(item.rating))})</span>
        </div>

        <m.button
          type="button"
          className={`inline-flex h-[40px] w-full items-center justify-center rounded-[10px] px-4 text-sm font-semibold shadow-[0_6px_16px_rgba(0,0,0,0.14)] transition ${
            item.stock <= 0
              ? "cursor-not-allowed bg-black/15 text-black/45"
              : isInCart
                ? "bg-[#d63d3d] text-white hover:bg-[#be3131]"
                : "bg-brand-primary text-black hover:bg-[#dfa129]"
          }`}
          disabled={item.stock <= 0}
          whileTap={prefersReducedMotion || item.stock <= 0 ? undefined : { scale: 0.98 }}
          onClick={() => {
            if (isInCart && cartEntry) {
              removeFromCart(cartEntry.id);
              return;
            }

            addToCart(item, 1);
          }}
        >
          <m.span
            key={isInCart ? "in-cart" : "not-in-cart"}
            initial={prefersReducedMotion ? false : { y: 4, opacity: 0.75 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.18 }}
          >
            {item.stock > 0 ? (isInCart ? "Remove from cart" : "Add to Cart") : "Out of Stock"}
          </m.span>
        </m.button>
      </div>
    </article>
  );
}

ProductCard.propTypes = {
  badgeLabel: PropTypes.string,
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
