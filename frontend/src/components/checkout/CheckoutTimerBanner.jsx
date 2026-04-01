import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";

function formatDuration(milliseconds) {
  if (!milliseconds || milliseconds <= 0) {
    return "00:00";
  }

  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function CheckoutTimerBanner({ timerExpiry, onExpire }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!timerExpiry) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [timerExpiry]);

  const remaining = useMemo(() => Number(timerExpiry ?? 0) - now, [now, timerExpiry]);

  useEffect(() => {
    if (timerExpiry && remaining <= 0) {
      onExpire?.();
    }
  }, [onExpire, remaining, timerExpiry]);

  if (!timerExpiry) {
    return null;
  }

  return (
    <div className={`rounded-[20px] px-4 py-3 text-sm font-medium ${
      remaining > 0 ? "checkout-banner" : "checkout-banner-success"
    }`}>
      {remaining > 0 ? (
        <span>
          Offer expires in: <strong>{formatDuration(remaining)}</strong>
        </span>
      ) : (
        <span>Offer window refreshed. Your checkout is still active.</span>
      )}
    </div>
  );
}

CheckoutTimerBanner.propTypes = {
  timerExpiry: PropTypes.number,
  onExpire: PropTypes.func,
};

CheckoutTimerBanner.defaultProps = {
  timerExpiry: null,
  onExpire: undefined,
};

export default CheckoutTimerBanner;
