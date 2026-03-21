import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../utils/format";
import { normalizeProduct } from "../utils/normalize";

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const item = normalizeProduct(product);

  return (
    <article className="panel group overflow-hidden">
      <Link to={`/product/${item.id}`} className="block">
        <div className="relative aspect-[4/4.5] overflow-hidden rounded-t-[28px] bg-brand-secondary">
          <img
            src={item.imageUrls[0]}
            alt={item.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-x-4 top-4 flex items-center justify-between">
            <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-primary">
              {item.category?.name ?? "Candles"}
            </span>
            {item.discount > 0 && (
              <span className="rounded-full bg-brand-primary px-3 py-1 text-xs font-semibold text-white">
                {item.discount}% off
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="space-y-4 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-muted">
            {item.occasionTag}
          </p>
          <Link to={`/product/${item.id}`}>
            <h3 className="mt-2 font-display text-2xl font-semibold text-brand-dark">
              {item.name}
            </h3>
          </Link>
          <p className="mt-2 min-h-[3rem] text-sm leading-6 text-brand-dark/70">
            {item.description}
          </p>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xl font-extrabold text-brand-dark">
              {formatCurrency(item.price)}
            </p>
            {item.discount > 0 && (
              <p className="text-sm text-brand-muted line-through">
                {formatCurrency(item.price * (1 + item.discount / 100))}
              </p>
            )}
          </div>
          <p className="text-sm font-semibold text-brand-muted">Rating {item.rating.toFixed(1)}</p>
        </div>

        <button
          type="button"
          className="w-full rounded-full bg-brand-dark px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary"
          onClick={() => addToCart(item, 1)}
        >
          Add to Cart
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
