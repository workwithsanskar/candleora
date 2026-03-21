import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import StatusView from "../components/StatusView";
import { useCart } from "../context/CartContext";
import { catalogApi } from "../services/api";
import { formatApiError, formatCurrency } from "../utils/format";
import { normalizeProduct } from "../utils/normalize";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
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

  return (
    <section className="container-shell space-y-14 py-10">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <div className="panel overflow-hidden bg-brand-secondary p-4">
            <img
              src={selectedImage}
              alt={product.name}
              className="aspect-square w-full rounded-[24px] object-cover"
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
                    ? "border-brand-primary"
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

        <div className="panel space-y-6 p-6 sm:p-8">
          <div>
            <p className="eyebrow">{product.category?.name ?? "Candle collection"}</p>
            <h1 className="mt-3 font-display text-5xl font-semibold text-brand-dark">
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
            {product.discount > 0 && (
              <p className="text-lg text-brand-muted line-through">
                {formatCurrency(product.price * (1 + product.discount / 100))}
              </p>
            )}
            <p className="rounded-full bg-brand-secondary px-4 py-2 text-sm font-semibold text-brand-dark">
              Rating {product.rating.toFixed(1)}
            </p>
          </div>

          <p className="text-sm leading-8 text-brand-dark/75">{product.description}</p>

          <div className="grid gap-5 rounded-[28px] bg-brand-secondary p-5 sm:grid-cols-[auto_1fr] sm:items-end">
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
                  onClick={() => setQuantity((current) => current + 1)}
                  className="px-4 py-3 text-lg"
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
              className="rounded-full bg-brand-dark px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary"
            >
              Add to Cart
            </button>
            <button
              type="button"
              onClick={async () => {
                await addToCart(product, quantity);
                navigate("/checkout");
              }}
              className="rounded-full border border-brand-primary/20 px-6 py-3 text-sm font-semibold text-brand-dark transition hover:border-brand-primary hover:bg-brand-primary hover:text-white"
            >
              Buy Now
            </button>
          </div>

          <div className="rounded-[24px] border border-brand-primary/10 bg-white p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-muted">
              Availability
            </p>
            <p className="mt-3 text-sm leading-7 text-brand-dark/70">
              {product.stock > 0
                ? `${product.stock} units available. Orders are packed with care and dispatched with protective wrapping.`
                : "Currently unavailable."}
            </p>
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
