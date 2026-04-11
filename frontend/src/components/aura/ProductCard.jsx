import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import fallbackProductImage from "../../assets/designer/image-optimized.webp";
import { useCart } from "../../context/CartContext";
import { chatApi } from "../../services/api";
import { formatCurrency } from "../../utils/format";
import { applyImageFallback } from "../../utils/images";
import { getProductPath, normalizeProduct } from "../../utils/normalize";

function ProductCard({ product, analyticsContext }) {
  const { addToCart, items } = useCart();
  const item = normalizeProduct(product);
  const inCart = items.some((cartItem) => Number(cartItem.productId ?? cartItem.id) === Number(item.id));
  const productPath = getProductPath(item);

  const handleAddToCart = () => {
    addToCart(item, 1);

    if (inCart) {
      return;
    }

    void chatApi.logEvent({
      eventType: "PRODUCT_ADD_TO_CART",
      pagePath: analyticsContext?.pagePath,
      chatScope: analyticsContext?.chatScope,
      intent: analyticsContext?.intent,
      message: item.name,
      productId: Number(item.id),
      metadata: {
        source: "aura_product_card",
        productPath,
      },
    }).catch(() => {});
  };

  return (
    <article className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-[22px] border border-white/12 bg-black/28 p-3">
      <Link to={productPath} className="overflow-hidden rounded-[16px] bg-white/8">
        <img
          src={item.imageUrls[0]}
          alt={item.name}
          loading="lazy"
          decoding="async"
          onError={(event) => applyImageFallback(event, fallbackProductImage)}
          className="h-[88px] w-[72px] object-cover"
        />
      </Link>

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="line-clamp-2 text-sm font-semibold leading-5 text-white">{item.name}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/46">
              {item.occasionTag}
            </p>
          </div>
          <span className="shrink-0 text-sm font-semibold text-white">
            {formatCurrency(item.price)}
          </span>
        </div>

        <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/64">{item.description}</p>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={inCart}
            className={`inline-flex min-h-[36px] items-center justify-center rounded-full px-3.5 text-xs font-semibold transition ${
              inCart
                ? "cursor-default bg-white/12 text-white/52"
                : "bg-white text-black hover:bg-white/88"
            }`}
          >
            {inCart ? "In cart" : "Add to cart"}
          </button>

          <Link
            to={productPath}
            className="inline-flex min-h-[36px] items-center justify-center rounded-full border border-white/14 px-3.5 text-xs font-semibold text-white/84 transition hover:bg-white/10"
          >
            View
          </Link>
        </div>
      </div>
    </article>
  );
}

ProductCard.propTypes = {
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    imageUrl: PropTypes.string,
    imageUrls: PropTypes.arrayOf(PropTypes.string),
    name: PropTypes.string.isRequired,
    occasionTag: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    slug: PropTypes.string,
  }).isRequired,
  analyticsContext: PropTypes.shape({
    chatScope: PropTypes.string,
    intent: PropTypes.string,
    pagePath: PropTypes.string,
  }),
};

ProductCard.defaultProps = {
  analyticsContext: null,
};

export default ProductCard;
