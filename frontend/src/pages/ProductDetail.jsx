import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import StatusView from "../components/StatusView";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { catalogApi } from "../services/api";
import { formatApiError, formatCurrency } from "../utils/format";
import { normalizeProduct } from "../utils/normalize";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([catalogApi.getProduct(id), catalogApi.getRelatedProducts(id)])
      .then(([productResponse, relatedResponse]) => {
        if (!isMounted) {
          return;
        }

        const normalized = normalizeProduct(productResponse);
        setProduct(normalized);
        setSelectedImage(normalized.imageUrls[0]);
        setRelatedProducts(relatedResponse ?? []);
      })
      .catch((productError) => {
        if (isMounted) {
          setError(formatApiError(productError));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <section className="container-shell py-16">
        <StatusView
          title="Loading product details"
          message="Fetching the product gallery, pricing, and related recommendations."
        />
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className="container-shell py-16">
        <StatusView
          title="That product is unavailable"
          message={error || "The requested product could not be found."}
          action={
            <Link
              to="/shop"
              className="mt-6 inline-flex rounded-full bg-brand-primary px-5 py-3 text-sm font-semibold text-white"
            >
              Back to shop
            </Link>
          }
        />
      </section>
    );
  }

  const totalPrice = product.price * quantity;
  const wishlisted = isWishlisted(product.id);

  return (
    <section className="container-shell space-y-14 py-10">
      <div className="grid gap-8 xl:grid-cols-[0.94fr_1.06fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[36px] border border-brand-primary/15 bg-white/80 p-4 shadow-editorial">
            <img
              src={selectedImage}
              alt={product.name}
              className="aspect-[4/4.3] w-full rounded-[28px] object-cover"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {product.imageUrls.map((imageUrl) => (
              <button
                key={imageUrl}
                type="button"
                onClick={() => setSelectedImage(imageUrl)}
                className={`overflow-hidden rounded-[22px] border p-1 transition ${
                  selectedImage === imageUrl
                    ? "border-brand-primary shadow-float"
                    : "border-transparent bg-white/70"
                }`}
              >
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="aspect-square w-full rounded-[18px] object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="editorial-card space-y-6 bg-paper-glow p-6 sm:p-8">
          <div>
            <span className="editorial-badge">
              {product.category?.name ?? "Candle collection"}
            </span>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[0.95] text-brand-dark sm:text-6xl">
              {product.name}
            </h1>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.28em] text-brand-muted">
              Occasion: {product.occasionTag}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <p className="text-4xl font-extrabold text-brand-dark">
              {formatCurrency(product.price)}
            </p>
            {product.originalPrice > product.price && (
              <p className="text-lg text-brand-muted line-through">
                {formatCurrency(product.originalPrice)}
              </p>
            )}
            <p className="rounded-full bg-brand-secondary px-4 py-2 text-sm font-semibold text-brand-dark">
              Rating {product.rating.toFixed(1)}
            </p>
          </div>

          <p className="text-sm leading-8 text-brand-dark/75">{product.description}</p>

          <div className="grid gap-5 rounded-[30px] bg-white/75 p-5 shadow-float sm:grid-cols-[auto_1fr] sm:items-end">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-brand-dark">Quantity</p>
              <div className="inline-flex items-center rounded-full border border-brand-primary/15 bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((current) => Math.max(current - 1, 1))}
                  className="px-4 py-3 text-lg"
                >
                  -
                </button>
                <span className="min-w-12 text-center text-sm font-semibold">{quantity}</span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((current) =>
                      product.stock > 0 ? Math.min(current + 1, product.stock) : current,
                    )
                  }
                  disabled={product.stock <= quantity}
                  className="px-4 py-3 text-lg disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-brand-dark">Order total</p>
              <p className="text-3xl font-extrabold text-brand-dark">
                {formatCurrency(totalPrice)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              type="button"
              onClick={async () => {
                await addToCart(product, quantity);
                navigate("/cart");
              }}
              disabled={product.stock <= 0}
              className="rounded-full bg-brand-dark px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
            </button>
            <button
              type="button"
              onClick={async () => {
                await addToCart(product, quantity);
                navigate("/checkout");
              }}
              disabled={product.stock <= 0}
              className="rounded-full border border-brand-primary/20 px-6 py-3 text-sm font-semibold text-brand-dark transition hover:border-brand-primary hover:bg-brand-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Buy Now
            </button>
            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              className={`rounded-full border px-6 py-3 text-sm font-semibold transition ${
                wishlisted
                  ? "border-transparent bg-[#2f241d] text-white"
                  : "border-brand-primary/20 text-brand-dark hover:border-brand-primary hover:bg-brand-primary hover:text-white"
              }`}
            >
              {wishlisted ? "Wishlisted" : "Add to Wishlist"}
            </button>
          </div>

          <div className="grid gap-4 rounded-[28px] border border-brand-primary/10 bg-white/70 p-5 md:grid-cols-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-muted">
                Availability
              </p>
              <p className="mt-3 text-sm leading-7 text-brand-dark/70">
                {product.stock > 5
                  ? `${product.stock} units available.`
                  : product.stock > 0
                    ? `Only ${product.stock} left in stock.`
                    : "Currently unavailable."}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-muted">
                Scent notes
              </p>
              <p className="mt-3 text-sm leading-7 text-brand-dark/70">{product.scentNotes}</p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-muted">
                Burn time
              </p>
              <p className="mt-3 text-sm leading-7 text-brand-dark/70">{product.burnTime}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="eyebrow">Pair it with</p>
            <h2 className="section-title mt-3">Related candles</h2>
          </div>
          <Link className="text-sm font-semibold text-brand-primary" to="/shop">
            Continue browsing
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {relatedProducts.map((relatedProduct) => (
            <ProductCard key={relatedProduct.id} product={relatedProduct} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default ProductDetail;
