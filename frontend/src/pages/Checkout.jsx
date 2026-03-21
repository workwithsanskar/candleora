import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StatusView from "../components/StatusView";
import { useCart } from "../context/CartContext";
import { orderApi } from "../services/api";
import { formatApiError, formatCurrency } from "../utils/format";

const initialForm = {
  shippingName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  paymentMethod: "SIMULATED",
};

function Checkout() {
  const navigate = useNavigate();
  const { items, grandTotal, clearCart } = useCart();
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const order = await orderApi.createOrder({
        ...form,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });

      clearCart();
      navigate("/orders", { state: { placedOrderId: order.id } });
    } catch (orderError) {
      setError(formatApiError(orderError));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!items.length) {
    return (
      <section className="container-shell py-16">
        <StatusView
          title="Checkout is waiting on cart items"
          message="Add products to the cart before placing an order."
        />
      </section>
    );
  }

  return (
    <section className="container-shell py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <form className="panel space-y-6 p-6 sm:p-8" onSubmit={handleSubmit}>
          <div>
            <p className="eyebrow">Checkout</p>
            <h1 className="mt-3 font-display text-5xl font-semibold text-brand-dark">
              Shipping details
            </h1>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold text-brand-dark">Full name</span>
              <input
                required
                className="w-full rounded-2xl border border-brand-primary/15 bg-brand-secondary px-4 py-3 outline-none"
                name="shippingName"
                value={form.shippingName}
                onChange={handleChange}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-brand-dark">Phone</span>
              <input
                required
                className="w-full rounded-2xl border border-brand-primary/15 bg-brand-secondary px-4 py-3 outline-none"
                name="phone"
                value={form.phone}
                onChange={handleChange}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-brand-dark">Postal code</span>
              <input
                required
                className="w-full rounded-2xl border border-brand-primary/15 bg-brand-secondary px-4 py-3 outline-none"
                name="postalCode"
                value={form.postalCode}
                onChange={handleChange}
              />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold text-brand-dark">Address line 1</span>
              <input
                required
                className="w-full rounded-2xl border border-brand-primary/15 bg-brand-secondary px-4 py-3 outline-none"
                name="addressLine1"
                value={form.addressLine1}
                onChange={handleChange}
              />
            </label>
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-semibold text-brand-dark">Address line 2</span>
              <input
                className="w-full rounded-2xl border border-brand-primary/15 bg-brand-secondary px-4 py-3 outline-none"
                name="addressLine2"
                value={form.addressLine2}
                onChange={handleChange}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-brand-dark">City</span>
              <input
                required
                className="w-full rounded-2xl border border-brand-primary/15 bg-brand-secondary px-4 py-3 outline-none"
                name="city"
                value={form.city}
                onChange={handleChange}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-semibold text-brand-dark">State</span>
              <input
                required
                className="w-full rounded-2xl border border-brand-primary/15 bg-brand-secondary px-4 py-3 outline-none"
                name="state"
                value={form.state}
                onChange={handleChange}
              />
            </label>
          </div>

          <div className="rounded-[24px] bg-brand-secondary p-5">
            <p className="text-sm font-semibold text-brand-dark">Payment</p>
            <p className="mt-2 text-sm leading-7 text-brand-dark/70">
              This project uses a simulated payment step for v1. Orders complete immediately after submission.
            </p>
          </div>

          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-brand-dark px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary disabled:opacity-60"
          >
            {isSubmitting ? "Placing order..." : "Place order"}
          </button>
        </form>

        <aside className="panel h-fit space-y-5 p-6">
          <div>
            <p className="eyebrow">Summary</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-brand-dark">
              Your order
            </h2>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-[20px] bg-brand-secondary p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-brand-dark">{item.productName}</p>
                  <p className="text-xs text-brand-muted">Qty {item.quantity}</p>
                </div>
                <span className="text-sm font-semibold text-brand-dark">
                  {formatCurrency(item.lineTotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-brand-primary/10 pt-4">
            <span className="text-sm font-semibold text-brand-dark">Grand total</span>
            <span className="text-2xl font-extrabold text-brand-dark">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default Checkout;
