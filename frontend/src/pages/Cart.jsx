import { Link } from "react-router-dom";
import StatusView from "../components/StatusView";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../utils/format";

function Cart() {
  const { isAuthenticated } = useAuth();
  const { items, grandTotal, updateQuantity, removeFromCart, isLoading, error } = useCart();

  return (
    <section className="container-shell py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
        <div>
          <p className="eyebrow">Cart</p>
          <h1 className="page-title mt-3">
            Your candle selection
          </h1>
        </div>

          {isLoading ? (
            <StatusView
              title="Refreshing cart"
              message="Pulling the latest item quantities and totals."
            />
          ) : error ? (
            <StatusView title="Cart unavailable" message={error} />
          ) : items.length === 0 ? (
            <StatusView
              title="Your cart is empty"
              message="Browse the CandleOra collection and add a few favorites."
              action={
                <Link
                  to="/shop"
                  className="btn btn-primary mt-6"
                >
                  Start shopping
                </Link>
              }
            />
          ) : (
            items.map((item) => (
              <article
                key={item.id}
                className="panel grid gap-5 p-5 sm:grid-cols-[120px_1fr_auto] sm:items-center"
              >
                <img
                  src={item.imageUrl}
                  alt={item.productName}
                  className="aspect-square w-full rounded-[22px] object-cover"
                />
                <div>
                  <h2 className="panel-title">
                    {item.productName}
                  </h2>
                  <p className="mt-2 text-sm font-semibold text-brand-muted">
                    {formatCurrency(item.unitPrice)} each
                  </p>
                  <div className="mt-5 inline-flex items-center rounded-full border border-brand-primary/15 bg-brand-secondary">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-4 py-3 text-lg"
                    >
                      -
                    </button>
                    <span className="min-w-12 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-4 py-3 text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="space-y-4 text-right">
                  <p className="text-xl font-extrabold text-brand-dark">
                    {formatCurrency(item.lineTotal)}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="text-sm font-semibold text-brand-primary"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <aside className="panel h-fit space-y-6 p-6">
          <div>
            <p className="eyebrow">Summary</p>
            <h2 className="panel-title mt-3">
              Order snapshot
            </h2>
          </div>

          <div className="space-y-3 rounded-[24px] bg-brand-secondary p-5">
            <div className="flex items-center justify-between text-sm text-brand-dark/70">
              <span>Items</span>
              <span>{items.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-brand-dark/70">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="flex items-center justify-between border-t border-brand-primary/10 pt-3">
              <span className="text-sm font-semibold text-brand-dark">Estimated total</span>
              <span className="text-2xl font-extrabold text-brand-dark">
                {formatCurrency(grandTotal)}
              </span>
            </div>
          </div>

          {isAuthenticated ? (
            <Link
              to="/checkout"
              className="btn btn-secondary w-full text-center"
            >
              Proceed to checkout
            </Link>
          ) : (
            <Link
              to="/login"
              state={{ from: { pathname: "/checkout" } }}
              className="btn btn-primary w-full text-center"
            >
              Sign in to checkout
            </Link>
          )}
        </aside>
      </div>
    </section>
  );
}

export default Cart;
