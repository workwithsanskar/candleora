import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StatusView from "../components/StatusView";
import { useCart } from "../context/CartContext";
import { useCheckoutSession } from "../context/CheckoutSessionContext";

function Checkout() {
  const navigate = useNavigate();
  const { items } = useCart();
  const { hasActiveSession, session, startCartCheckout } = useCheckoutSession();

  useEffect(() => {
    if (!hasActiveSession) {
      if (items.length) {
        startCartCheckout(items);
        navigate("/checkout/address", { replace: true });
        return;
      }

      navigate("/cart", { replace: true });
      return;
    }

    if (!session.addressCompleted || !session.addressId) {
      navigate("/checkout/address", { replace: true });
      return;
    }

    navigate("/checkout/payment", { replace: true });
  }, [
    hasActiveSession,
    items,
    navigate,
    session.addressCompleted,
    session.addressId,
    startCartCheckout,
  ]);

  return (
    <section className="container-shell py-16">
      <StatusView
        title="Preparing checkout"
        message="We're arranging your items and the next step right now."
      />
    </section>
  );
}

export default Checkout;
