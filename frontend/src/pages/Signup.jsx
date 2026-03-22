import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PhoneAuthPanel from "../components/PhoneAuthPanel";
import { useAuth } from "../context/AuthContext";
import signupImage from "../assets/designer/signup-candle-img.jpg";
import {
  buildPhonePayload,
  buildSignupPayload,
  createAccountForm,
} from "../utils/account";
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

function Signup() {
  const navigate = useNavigate();
  const { signup, phoneAuth, isLoading } = useAuth();
  const [form, setForm] = useState(() => ({
    ...createAccountForm(),
    confirmPassword: "",
    acceptedTerms: false,
  }));
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      return "Please enter your full name.";
    }

    if (!form.email.trim()) {
      return "Please enter your email address.";
    }

    if (form.password.length < 8) {
      return "Password must be at least 8 characters long.";
    }

    if (form.password !== form.confirmPassword) {
      return "Password and confirm password must match.";
    }

    if (!form.acceptedTerms) {
      return "Please accept the terms and privacy policy to continue.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm();
    setError(validationError);

    if (validationError) {
      return;
    }

    try {
      await signup(buildSignupPayload(form));
      navigate("/profile", { replace: true });
    } catch (signupError) {
      setError(formatApiError(signupError));
    }
  };

  const handlePhoneSignup = async ({ idToken, phoneNumber }) => {
    setError("");

    try {
      await phoneAuth(buildPhonePayload(form, idToken, phoneNumber));
      navigate("/profile", { replace: true });
    } catch (phoneError) {
      setError(formatApiError(phoneError));
    }
  };

  return (
    <section className="container-shell py-8 sm:py-10 lg:py-10">
      <div className="mx-auto max-w-[1120px] overflow-hidden rounded-[18px] border border-[#e4ddd6] bg-white shadow-[0_20px_48px_rgba(42,28,18,0.07)] lg:grid lg:grid-cols-[0.98fr_1.02fr]">
        <div className="bg-white px-6 py-7 sm:px-9 sm:py-8 lg:px-10 lg:py-9">
          <div className="mx-auto max-w-[520px]">
            <div>
              <h1 className="text-[2.3rem] font-semibold tracking-[-0.03em] text-brand-dark sm:text-[2.7rem]">
                Signup
              </h1>
              <p className="mt-2 text-[14px] leading-6 text-brand-dark/60">
                Already Have An Account,{" "}
                <Link className="font-semibold text-brand-dark underline underline-offset-4" to="/login">
                  Login.
                </Link>
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block space-y-2.5">
                  <span className="text-[13px] font-semibold text-brand-dark">Full Name</span>
                  <input
                    required
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="lorem Ipsum"
                    className="w-full rounded-full border border-[#ddd6cf] bg-white px-6 py-3.5 text-[14px] text-brand-dark outline-none transition placeholder:text-brand-dark/35 focus:border-brand-primary"
                  />
                </label>

                <label className="block space-y-2.5">
                  <span className="text-[13px] font-semibold text-brand-dark">Email</span>
                  <input
                    required
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="loremipsum@gmail.com"
                    className="w-full rounded-full border border-[#ddd6cf] bg-white px-6 py-3.5 text-[14px] text-brand-dark outline-none transition placeholder:text-brand-dark/35 focus:border-brand-primary"
                  />
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block space-y-2.5">
                  <span className="text-[13px] font-semibold text-brand-dark">Password</span>
                  <span className="relative block">
                    <input
                      required
                      minLength={8}
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Password"
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
                  <span className="text-[12px] text-brand-dark/45">
                    Use at least 8 characters.
                  </span>
                </label>

                <label className="block space-y-2.5">
                  <span className="text-[13px] font-semibold text-brand-dark">Confirm Password</span>
                  <span className="relative block">
                    <input
                      required
                      minLength={8}
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm Password"
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
              </div>

              <label className="flex items-start gap-3 pt-1 text-[14px] leading-6 text-brand-dark/65">
                <input
                  type="checkbox"
                  name="acceptedTerms"
                  checked={form.acceptedTerms}
                  onChange={handleChange}
                  className="mt-1 h-5 w-5 rounded border border-[#d6cec6]"
                />
                <span>
                  I have read and agreed to the{" "}
                  <Link
                    className="font-semibold text-brand-dark underline underline-offset-4"
                    to="/terms-and-conditions"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    className="font-semibold text-brand-dark underline underline-offset-4"
                    to="/privacy-policy"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>

              {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full bg-[#2d2d2d] px-6 py-3.5 text-[14px] font-semibold text-white transition hover:bg-brand-primary disabled:opacity-60"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="mt-7 space-y-4 border-t border-[#eee5dd] pt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-dark/45">
                Or continue with
              </p>

              <PhoneAuthPanel
                title="Sign up with mobile OTP"
                description="Verify your mobile number and create your CandleOra account faster."
                defaultPhoneNumber={form.phoneNumber}
                disabled={isLoading}
                onVerified={handlePhoneSignup}
                compact
              />
            </div>
          </div>
        </div>

        <div className="relative hidden min-h-[560px] border-l border-[#e8dfd6] lg:block">
          <img
            src={signupImage}
            alt="CandleOra signup arrangement"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(22,15,10,0.38)] via-[rgba(22,15,10,0.08)] to-[rgba(22,15,10,0.18)]" />
          <div className="absolute left-8 top-8 max-w-[320px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75 [text-shadow:0_2px_12px_rgba(0,0,0,0.28)]">
              CandleOra Membership
            </p>
            <p className="mt-3 max-w-[290px] text-[1.05rem] font-semibold leading-6 text-white [text-shadow:0_4px_18px_rgba(0,0,0,0.34)]">
              Create your account to save favorites, manage orders, and enjoy faster checkout.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Signup;
