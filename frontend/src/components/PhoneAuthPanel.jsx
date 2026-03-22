import PropTypes from "prop-types";
import { useEffect, useId, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  createRecaptchaVerifier,
  isFirebaseConfigured,
  requestPhoneOtp,
  signOutFirebaseAuth,
} from "../services/firebase";
import { formatApiError } from "../utils/format";

function normalizePhoneNumber(rawPhone) {
  const digits = String(rawPhone ?? "").replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits.startsWith("91") && digits.length === 12) {
    return `+${digits}`;
  }

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.startsWith("0") && digits.length === 11) {
    return `+91${digits.slice(1)}`;
  }

  if (String(rawPhone).trim().startsWith("+")) {
    return String(rawPhone).trim();
  }

  return `+${digits}`;
}

function PhoneAuthPanel({
  title,
  description,
  disabled,
  onVerified,
  defaultPhoneNumber,
  compact,
}) {
  const widgetId = useId().replace(/:/g, "");
  const verifierRef = useRef(null);
  const confirmationRef = useRef(null);
  const [phoneNumber, setPhoneNumber] = useState(defaultPhoneNumber ?? "");
  const [otp, setOtp] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const isSecureContextReady =
    typeof window === "undefined" ||
    window.isSecureContext ||
    window.location.hostname === "localhost";

  useEffect(() => {
    setPhoneNumber(defaultPhoneNumber ?? "");
  }, [defaultPhoneNumber]);

  useEffect(
    () => () => {
      if (verifierRef.current) {
        verifierRef.current.clear();
        verifierRef.current = null;
      }
    },
    [],
  );

  const ensureVerifier = async () => {
    if (verifierRef.current) {
      return verifierRef.current;
    }

    verifierRef.current = await createRecaptchaVerifier(`recaptcha-${widgetId}`);
    return verifierRef.current;
  };

  const handleSendOtp = async () => {
    const normalizedPhone = normalizePhoneNumber(phoneNumber);

    if (!normalizedPhone) {
      setError("Enter a valid mobile number to continue.");
      return;
    }

    setError("");
    setStatusMessage("");
    setIsSending(true);
    setOtp("");

    try {
      const verifier = await ensureVerifier();
      confirmationRef.current = await requestPhoneOtp(normalizedPhone, verifier);
      setPhoneNumber(normalizedPhone);
      setStatusMessage(`OTP sent to ${normalizedPhone}.`);
      toast.success("OTP sent.");
    } catch (sendError) {
      const message = formatApiError(sendError);
      setError(message);
      toast.error(message);
      if (verifierRef.current) {
        verifierRef.current.clear();
        verifierRef.current = null;
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationRef.current) {
      setError("Request an OTP first.");
      return;
    }

    if (!otp.trim()) {
      setError("Enter the OTP to continue.");
      return;
    }

    setError("");
    setStatusMessage("");
    setIsVerifying(true);

    try {
      const credential = await confirmationRef.current.confirm(otp.trim());
      const idToken = await credential.user.getIdToken();
      await onVerified({
        idToken,
        phoneNumber: credential.user.phoneNumber ?? phoneNumber,
      });
      setStatusMessage("Phone verified. You're being signed in.");
      setOtp("");
      confirmationRef.current = null;
      await signOutFirebaseAuth();
    } catch (verifyError) {
      const message = formatApiError(verifyError);
      setError(message);
      toast.error(message);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isFirebaseConfigured()) {
    return (
      <div className="rounded-[24px] border border-dashed border-brand-primary/20 bg-brand-secondary/50 p-5">
        <p className="text-sm font-semibold text-brand-dark">Phone OTP sign-in</p>
        <p className="mt-2 text-sm leading-7 text-brand-dark/70">
          Add the Firebase client environment variables to enable phone login and signup.
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        compact
          ? "rounded-[20px] border border-brand-primary/12 bg-brand-secondary/45 p-4"
          : "rounded-[26px] border border-brand-primary/12 bg-brand-secondary/60 p-5"
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`${compact ? "text-[13px]" : "text-sm"} font-semibold text-brand-dark`}>
            {title}
          </p>
          <p
            className={`${
              compact ? "mt-1 text-[12px] leading-6" : "mt-2 text-sm leading-7"
            } text-brand-dark/70`}
          >
            {description}
          </p>
        </div>
      </div>

      <div className={`${compact ? "mt-4 gap-3" : "mt-5 gap-4"} grid sm:grid-cols-[1fr_auto]`}>
        {!isSecureContextReady && (
          <div className="sm:col-span-2 rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            Phone OTP works only on HTTPS or localhost. Open this page in a secure browser context to continue.
          </div>
        )}

        <label className="space-y-2 sm:col-span-2">
          <span className={`${compact ? "text-[12px]" : "text-sm"} font-semibold text-brand-dark`}>
            Mobile number
          </span>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            placeholder="+91 98765 43210"
            disabled={disabled || isSending || isVerifying}
            className={`w-full border border-brand-primary/15 bg-white px-4 outline-none ${
              compact ? "rounded-[16px] py-2.5 text-[13px]" : "rounded-2xl py-3"
            }`}
          />
        </label>

        <button
          type="button"
          onClick={handleSendOtp}
          disabled={disabled || isSending || isVerifying || !isSecureContextReady}
          className={`rounded-full border border-brand-primary/20 px-5 font-semibold text-brand-dark transition hover:border-brand-primary hover:text-brand-primary disabled:opacity-60 sm:w-fit ${
            compact ? "py-2.5 text-[12px]" : "py-3 text-sm"
          }`}
        >
          {isSending ? "Sending OTP..." : "Send OTP"}
        </button>

        <label className="space-y-2">
          <span className={`${compact ? "text-[12px]" : "text-sm"} font-semibold text-brand-dark`}>
            OTP
          </span>
          <input
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            inputMode="numeric"
            placeholder="Enter 6-digit code"
            disabled={disabled || isVerifying}
            className={`w-full border border-brand-primary/15 bg-white px-4 outline-none ${
              compact ? "rounded-[16px] py-2.5 text-[13px]" : "rounded-2xl py-3"
            }`}
          />
        </label>

        <button
          type="button"
          onClick={handleVerifyOtp}
          disabled={disabled || isSending || isVerifying || !isSecureContextReady}
          className={`rounded-full bg-brand-dark px-5 font-semibold text-white transition hover:bg-brand-primary disabled:opacity-60 sm:self-end ${
            compact ? "py-2.5 text-[12px]" : "py-3 text-sm"
          }`}
        >
          {isVerifying ? "Verifying..." : "Verify phone"}
        </button>
      </div>

      <div id={`recaptcha-${widgetId}`} />

      {statusMessage && <p className="mt-4 text-sm font-semibold text-green-700">{statusMessage}</p>}
      {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
    </div>
  );
}

PhoneAuthPanel.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  disabled: PropTypes.bool,
  onVerified: PropTypes.func.isRequired,
  defaultPhoneNumber: PropTypes.string,
  compact: PropTypes.bool,
};

PhoneAuthPanel.defaultProps = {
  title: "Phone OTP",
  description: "Use a one-time password for faster sign-in on mobile.",
  disabled: false,
  defaultPhoneNumber: "",
  compact: false,
};

export default PhoneAuthPanel;
