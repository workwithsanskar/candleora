import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { formatCurrency } from "../utils/format";
import { normalizeProduct } from "../utils/normalize";

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const item = normalizeProduct(product);
  const wishlisted = isWishlisted(item.id);

  return (
    <article className="group overflow-hidden rounded-[30px] border border-brand-primary/15 bg-white/80 shadow-float transition duration-300 hover:-translate-y-1 hover:shadow-editorial">
      <Link to={`/product/${item.id}`} className="block">
        <div className="relative aspect-[4/4.65] overflow-hidden bg-[#f1e6db]">
          <img
            src={item.imageUrls[0]}
            alt={item.name}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#241912]/35 via-transparent to-white/10" />
          <div className="absolute inset-x-4 top-4 flex items-center justify-between">
            <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-primary shadow-float">
              {item.category?.name ?? "Candles"}
            </span>
            <div className="flex items-center gap-2">
              {item.discount > 0 && (
                <span className="rounded-full bg-brand-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                  {item.discount}% off
                </span>
              )}
              <button
                type="button"
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                onClick={(event) => {
                  event.preventDefault();
                  toggleWishlist(item);
                }}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
                  wishlisted
                    ? "border-transparent bg-[#2f241d] text-white"
                    : "border-white/60 bg-white/90 text-brand-dark"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7">
                  <path
                    d="M12 20.5L4.8 13.6C2.8 11.6 2.7 8.4 4.5 6.5C6.2 4.8 9 4.8 10.8 6.4L12 7.5L13.2 6.4C15 4.8 17.8 4.8 19.5 6.5C21.3 8.4 21.2 11.6 19.2 13.6L12 20.5Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="absolute inset-x-4 bottom-4">
            <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-brand-dark shadow-float">
              {item.occasionTag}
            </span>
          </div>
        </div>
      </Link>

      <div className="space-y-4 p-5">
        <div>
          <Link to={`/product/${item.id}`}>
            <h3 className="font-display text-[2rem] font-semibold leading-none text-brand-dark">
              {item.name}
            </h3>
          </Link>
          <p className="mt-3 min-h-[3rem] text-sm leading-7 text-brand-dark/70">
            {item.description}
          </p>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-2xl font-extrabold text-brand-dark">
              {formatCurrency(item.price)}
            </p>
            {item.originalPrice > item.price && (
              <p className="text-sm text-brand-muted line-through">
                {formatCurrency(item.originalPrice)}
              </p>
            )}
          </div>
          <div className="space-y-2 text-right">
            <p className="rounded-full bg-[#f8efe5] px-3 py-2 text-sm font-semibold text-brand-muted">
              Rating {item.rating.toFixed(1)}
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">
              {item.stock > 5
                ? "In stock"
                : item.stock > 0
                  ? `Only ${item.stock} left`
                  : "Out of stock"}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="w-full rounded-full bg-brand-dark px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary disabled:cursor-not-allowed disabled:opacity-50"
          disabled={item.stock <= 0}
          onClick={() => addToCart(item, 1)}
        >
          {item.stock > 0 ? "Add to Cart" : "Out of Stock"}
        </button>
      </div>
    </article>
  );
}

ProductCard.propTypes = {
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
