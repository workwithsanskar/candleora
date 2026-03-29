import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import StatusView from "../components/StatusView";
import { useCart } from "../context/CartContext";
import { paymentApi } from "../services/api";
import { clearCheckoutDraftForStoredSession } from "../utils/checkoutStorage";
import { formatApiError, titleCase } from "../utils/format";

function PhonePeReturn() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const orderId = searchParams.get("orderId");

  const checkStatus = async () => {
    if (!orderId) {
      setError("The PhonePe return did not include an order reference.");
      setIsLoading(false);
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await paymentApi.getPhonePeStatus(orderId);
      setOrder(response);

      if (response.paymentStatus === "PAID") {
        clearCheckoutDraftForStoredSession();
        clearCart();
        toast.success("Payment confirmed.");
        navigate(`/order-confirmation/${response.id}`, { replace: true });
      }
    } catch (statusError) {
      setError(formatApiError(statusError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [orderId]);

  if (isLoading) {
    return (
      <section className="container-shell py-16">
        <StatusView
          title="Checking your PhonePe payment"
          message="We are confirming the transaction status with PhonePe."
        />
      </section>
    );
  }

  if (error) {
    return (
      <section className="container-shell py-16">
        <StatusView
          title="PhonePe payment could not be verified"
          message={error}
          action={
            <button type="button" onClick={checkStatus} className="btn btn-secondary mt-6">
              Check again
            </button>
          }
        />
      </section>
    );
  }

  if (!order) {
    return (
      <section className="container-shell py-16">
        <StatusView title="Payment details unavailable" message="We could not load the order status." />
      </section>
    );
  }

  return (
    <section className="container-shell py-16">
      <div className="editorial-card mx-auto max-w-3xl p-8 text-center">
        <p className="eyebrow">PhonePe payment</p>
        <h1 className="page-title mt-4">
          {order.paymentStatus === "FAILED"
            ? "The payment was not completed."
            : "The payment is still being confirmed."}
        </h1>
        <p className="mt-4 text-sm leading-8 text-brand-dark/70">
          Order #{order.id} is currently {titleCase(order.paymentStatus).toLowerCase()}.
          {order.paymentStatus === "FAILED"
            ? " You can return to checkout and try again."
            : " Use the button below to re-check the status in a moment."}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {order.paymentStatus !== "FAILED" && (
            <button type="button" onClick={checkStatus} className="btn btn-secondary">
              Check status again
            </button>
          )}
          <Link to="/checkout" className="btn btn-outline">
            Back to checkout
          </Link>
          <Link to={`/orders/${order.id}`} className="btn btn-primary">
            View order
          </Link>
        </div>
      </div>
    </section>
  );
}

export default PhonePeReturn;
