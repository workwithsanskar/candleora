import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import heroImage from "../assets/designer/candle-login-img.webp";
import { authApi } from "../services/api";
import { formatApiError, formatDateTime } from "../utils/format";

function ForgotPassword() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const previewUrl = result?.previewUrl ?? "";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);
    setIsSubmitting(true);

    try {
      const response = await authApi.requestPasswordReset({ email });
      setResult(response);
    } catch (requestError) {
      setError(formatApiError(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPreviewLink = async () => {
    if (!previewUrl || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    await navigator.clipboard.writeText(previewUrl);
  };

  return (
    <section className="container-shell py-8 sm:py-10 lg:py-10">
      <div className="balanced-split-layout mx-auto max-w-[1120px] overflow-hidden rounded-[18px] border border-[#e4ddd6] bg-white shadow-[0_20px_48px_rgba(42,28,18,0.07)] lg:grid lg:grid-cols-[0.98fr_1.02fr]">
        <div className="bg-white px-6 py-7 sm:px-9 sm:py-8 lg:px-10 lg:py-9">
          <div className="mx-auto max-w-[500px]">
            <div>
              <h1 className="page-title tracking-[-0.03em]">Forgot Password</h1>
              <p className="mt-2 text-[14px] leading-6 text-brand-dark/60">
                Enter your account email and we will prepare a password reset link.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block space-y-2.5">
                <span className="text-[13px] font-semibold text-brand-dark">Email Address</span>
                <input
                  required
                  type="email"
                  name="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="loremipsum@gmail.com"
                  autoComplete="email"
                  className="w-full rounded-full border border-[#ddd6cf] bg-white px-6 py-3.5 text-[14px] text-brand-dark outline-none transition placeholder:text-brand-dark/35 focus:border-brand-primary"
                />
              </label>

              {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}

              {result ? (
                <div className="space-y-3 rounded-[22px] border border-black/10 bg-[#fbf7f0] p-5">
                  <p className="text-sm font-medium leading-6 text-brand-dark">{result.message}</p>
                  {result.expiresAt ? (
                    <p className="text-sm leading-6 text-brand-muted">This preview link expires on {formatDateTime(result.expiresAt)}.</p>
                  ) : null}
                  {previewUrl ? (
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={previewUrl}
                        className="btn btn-secondary"
                      >
                        Open Reset Page
                      </a>
                      <button
                        type="button"
                        onClick={handleCopyPreviewLink}
                        className="btn btn-outline"
                      >
                        Copy Link
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-secondary w-full disabled:opacity-60"
              >
                {isSubmitting ? "Preparing Link..." : "Send Reset Link"}
              </button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-[14px] font-semibold text-brand-dark transition hover:underline hover:underline-offset-4"
                >
                  Back to Login
                </Link>
              </div>
            </form>
          </div>
        </div>

        <div className="balanced-split-media relative hidden min-h-[560px] border-l border-[#e8dfd6] lg:block">
          <img
            src={heroImage}
            alt="CandleOra candle arrangement"
            className="balanced-split-visual absolute inset-0"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(22,15,10,0.42)] via-[rgba(22,15,10,0.08)] to-[rgba(22,15,10,0.18)]" />
          <div className="absolute left-8 top-8 max-w-[320px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75 [text-shadow:0_2px_12px_rgba(0,0,0,0.28)]">
              CandleOra Access
            </p>
            <p className="mt-3 max-w-[290px] text-[1.05rem] font-semibold leading-6 text-white [text-shadow:0_4px_18px_rgba(0,0,0,0.34)]">
              Reset your password and get back to your orders, cart, and account details quickly.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ForgotPassword;
