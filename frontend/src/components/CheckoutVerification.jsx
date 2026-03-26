import PropTypes from "prop-types";
import PhoneAuthPanel from "./PhoneAuthPanel";

function VerificationBadge({ tone, children }) {
  const toneClassName =
    tone === "success"
      ? "border-green/20 bg-green/10 text-green-800"
      : "border-brand-primary/20 bg-brand-primary/10 text-black/75";

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${toneClassName}`}>
      {children}
    </span>
  );
}

function CheckoutVerification({
  user,
  defaultPhoneNumber,
  isSendingEmailVerification,
  emailVerificationPreviewUrl,
  onPhoneVerified,
  onSendEmailVerification,
}) {
  return (
    <div className="panel space-y-6 p-6 sm:p-8">
      <div className="space-y-4">
        <p className="eyebrow">Secure your order</p>
        <div className="space-y-3">
          <h1 className="page-title">Verify contact details before payment.</h1>
          <p className="max-w-2xl text-sm leading-7 text-black/70">
            We keep signup light, but we verify the delivery phone number before the first order so shipping updates,
            COD confirmation, and support follow-ups reach the right person.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <VerificationBadge tone={user?.phoneVerified ? "success" : "neutral"}>
            {user?.phoneVerified ? "Phone verified" : "Phone verification required"}
          </VerificationBadge>
          <VerificationBadge tone={user?.emailVerified ? "success" : "neutral"}>
            {user?.emailVerified ? "Email verified" : "Email verification recommended"}
          </VerificationBadge>
        </div>
      </div>

      {!user?.phoneVerified && (
        <PhoneAuthPanel
          compact
          title="Verify your phone number"
          description="Use OTP to unlock checkout and keep delivery contact details verified."
          defaultPhoneNumber={defaultPhoneNumber}
          onVerified={onPhoneVerified}
        />
      )}

      {!user?.emailVerified && (
        <div className="rounded-[24px] border border-black/10 bg-white p-5">
          <div className="space-y-2">
            <h2 className="panel-title">Email verification</h2>
            <p className="text-sm leading-7 text-black/68">
              This stays optional for browsing, but it helps with password recovery and order communication.
            </p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onSendEmailVerification}
              disabled={isSendingEmailVerification}
              className="btn btn-outline disabled:opacity-60"
            >
              {isSendingEmailVerification ? "Preparing link..." : "Send verification link"}
            </button>

            {emailVerificationPreviewUrl && (
              <a
                href={emailVerificationPreviewUrl}
                className="text-sm font-semibold text-black underline underline-offset-4"
              >
                Open preview link
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

CheckoutVerification.propTypes = {
  user: PropTypes.shape({
    phoneVerified: PropTypes.bool,
    emailVerified: PropTypes.bool,
  }),
  defaultPhoneNumber: PropTypes.string,
  isSendingEmailVerification: PropTypes.bool,
  emailVerificationPreviewUrl: PropTypes.string,
  onPhoneVerified: PropTypes.func.isRequired,
  onSendEmailVerification: PropTypes.func.isRequired,
};

CheckoutVerification.defaultProps = {
  user: null,
  defaultPhoneNumber: "",
  isSendingEmailVerification: false,
  emailVerificationPreviewUrl: "",
};

export default CheckoutVerification;
