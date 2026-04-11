import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import heroImage from "../assets/designer/candle-login-img.webp";
import { authApi } from "../services/api";
import { formatApiError } from "../utils/format";

function EyeIcon({ visible }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path
        d="M2.5 12C4.4 8.7 7.8 6.5 12 6.5C16.2 6.5 19.6 8.7 21.5 12C19.6 15.3 16.2 17.5 12 17.5C7.8 17.5 4.4 15.3 2.5 12Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" />
      {!visible && <path d="M4 20L20 4" strokeLinecap="round" />}
    </svg>
  );
}

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => String(searchParams.get("token") ?? "").trim(), [searchParams]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!token) {
      setError("This password reset link is missing a token.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password must match.");
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.confirmPasswordReset({ token, password });
      setSuccessMessage("Password updated successfully. You can log in with your new password now.");
      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (resetError) {
      setError(formatApiError(resetError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="container-shell py-8 sm:py-10 lg:py-10">
      <div className="balanced-split-layout mx-auto max-w-[1120px] overflow-hidden rounded-[18px] border border-[#e4ddd6] bg-white shadow-[0_20px_48px_rgba(42,28,18,0.07)] lg:grid lg:grid-cols-[0.98fr_1.02fr]">
        <div className="bg-white px-6 py-7 sm:px-9 sm:py-8 lg:px-10 lg:py-9">
          <div className="mx-auto max-w-[500px]">
            <div>
              <h1 className="page-title tracking-[-0.03em]">Reset Password</h1>
              <p className="mt-2 text-[14px] leading-6 text-brand-dark/60">
                Create a new password for your CandleOra account.
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block space-y-2.5">
                <span className="text-[13px] font-semibold text-brand-dark">New Password</span>
                <span className="relative block">
                  <input
                    required
                    minLength={8}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="New password"
                    autoComplete="new-password"
                    className="w-full rounded-full border border-[#ddd6cf] bg-white px-6 py-3.5 pr-14 text-[14px] text-brand-dark outline-none transition placeholder:text-brand-dark/35 focus:border-brand-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-dark/35 transition hover:text-brand-dark"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <EyeIcon visible={showPassword} />
                  </button>
                </span>
              </label>

              <label className="block space-y-2.5">
                <span className="text-[13px] font-semibold text-brand-dark">Confirm Password</span>
                <span className="relative block">
                  <input
                    required
                    minLength={8}
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm password"
                    autoComplete="new-password"
                    className="w-full rounded-full border border-[#ddd6cf] bg-white px-6 py-3.5 pr-14 text-[14px] text-brand-dark outline-none transition placeholder:text-brand-dark/35 focus:border-brand-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-dark/35 transition hover:text-brand-dark"
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    <EyeIcon visible={showConfirmPassword} />
                  </button>
                </span>
              </label>

              {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
              {successMessage ? <p className="text-sm font-semibold text-green-700">{successMessage}</p> : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-secondary w-full disabled:opacity-60"
              >
                {isSubmitting ? "Updating Password..." : "Update Password"}
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
              Choose a strong new password and return to your account in a minute.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ResetPassword;
