import { Link } from "react-router-dom";
import StatusView from "../components/StatusView";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { formatCurrency } from "../utils/format";

function Wishlist() {
  const { addToCart } = useCart();
  const { items, removeFromWishlist, clearWishlist } = useWishlist();

  if (!items.length) {
    return (
      <section className="container-shell py-10">
        <StatusView
          title="Your wishlist is empty"
          message="Save your favorite CandleOra products here and come back when you are ready to shop."
          action={
            <Link
              to="/shop"
              className="btn btn-primary mt-6"
            >
              Explore the shop
            </Link>
          }
        />
      </section>
    );
  }

  return (
    <section className="container-shell py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Wishlist</p>
          <h1 className="page-title mt-3">
            Saved for later
          </h1>
        </div>

        <button
          type="button"
          onClick={clearWishlist}
          className="text-sm font-semibold text-brand-primary"
        >
          Clear wishlist
        </button>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="panel grid gap-5 p-5 sm:grid-cols-[120px_1fr] sm:items-center"
          >
            <img
              src={item.imageUrl}
              alt={item.name}
              className="aspect-square w-full rounded-[22px] object-cover"
            />

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">
                  {item.category?.name ?? "Candles"}
                </p>
                <h2 className="panel-title mt-2">
                  {item.name}
                </h2>
                <div className="mt-3 flex items-center gap-2">
                  {item.originalPrice > item.price && (
                    <span className="text-sm text-brand-muted line-through">
                      {formatCurrency(item.originalPrice)}
                    </span>
                  )}
                  <span className="text-xl font-extrabold text-brand-dark">
                    {formatCurrency(item.price)}
                  </span>
                </div>
                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-primary">
                  {item.stock > 0 ? "In stock" : "Out of stock"}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => addToCart(item, 1)}
                  disabled={item.stock <= 0}
                  className="btn btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add to cart
                </button>
                <Link
                  to={`/product/${item.id}`}
                  className="btn btn-outline"
                >
                  View product
                </Link>
                <button
                  type="button"
                  onClick={() => removeFromWishlist(item.id)}
                  className="text-sm font-semibold text-brand-primary"
                >
                  Remove
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Wishlist;
