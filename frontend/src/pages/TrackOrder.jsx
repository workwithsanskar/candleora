import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { orderApi } from "../services/api";
import { formatApiError } from "../utils/format";

function TrackOrder() {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedOrderId = orderId.trim();
    const trimmedEmail = billingEmail.trim().toLowerCase();

    if (!trimmedOrderId || !trimmedEmail) {
      setError("Enter your order ID and billing email to continue.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const order = await orderApi.getOrder(trimmedOrderId);

      if (String(order?.contactEmail ?? "").trim().toLowerCase() !== trimmedEmail) {
        setError("That billing email does not match the selected order.");
        return;
      }

      navigate(`/orders/${order.id}`);
    } catch (trackError) {
      setError(formatApiError(trackError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="container-shell py-10 sm:py-12">
      <div className="space-y-10">
        <header className="space-y-3">
          <h1 className="page-title uppercase">My Account</h1>
          <p className="max-w-[820px] text-sm leading-7 text-black/58 sm:text-body">
            Enter your order details below to quickly view the latest CandleOra tracking and
            delivery information for your purchase.
          </p>
        </header>

        <div className="mx-auto max-w-[770px] rounded-[12px] border border-black/14 bg-white px-6 py-10 shadow-[0_18px_60px_rgba(0,0,0,0.08)] sm:px-10 sm:py-14">
          <div className="mx-auto max-w-[560px] text-center">
            <h2 className="font-heading text-heading-lg leading-tight text-black">Track Your Order</h2>
            <p className="mt-3 text-sm leading-6 text-black/50 sm:text-body">
              Your order has been confirmed and is on the way. Enter your order details below to
              view the latest tracking status.
            </p>
          </div>

          <form className="mx-auto mt-10 max-w-[560px] space-y-8" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="space-y-2 text-left">
                <span className="text-sm font-medium text-black/72">Order ID</span>
                <input
                  type="text"
                  value={orderId}
                  onChange={(event) => setOrderId(event.target.value)}
                  placeholder="ABE1345678"
                  className="h-12 w-full rounded-full border border-black/12 bg-white px-5 text-sm text-black outline-none transition placeholder:text-black/28 focus:border-black/40"
                />
              </label>

              <label className="space-y-2 text-left">
                <span className="text-sm font-medium text-black/72">Billing Email</span>
                <input
                  type="email"
                  value={billingEmail}
                  onChange={(event) => setBillingEmail(event.target.value)}
                  placeholder="person@gmail.com"
                  className="h-12 w-full rounded-full border border-black/12 bg-white px-5 text-sm text-black outline-none transition placeholder:text-black/28 focus:border-black/40"
                />
              </label>
            </div>

            {error && <p className="text-sm font-medium text-danger">{error}</p>}

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-w-[188px] items-center justify-center rounded-full bg-black px-8 py-4 text-base font-semibold text-white transition hover:bg-black/82 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Tracking..." : "Track Your Order"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

export default TrackOrder;
