import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PhoneAuthPanel from "../components/PhoneAuthPanel";
import { useAuth } from "../context/AuthContext";
import heroImage from "../assets/designer/candle-login-img.jpg";
import { buildPhonePayload } from "../utils/account";
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

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, phoneAuth, isLoading } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const redirectTo = location.state?.from?.pathname ?? "/profile";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await login(form);
      navigate(redirectTo, { replace: true });
    } catch (loginError) {
      setError(formatApiError(loginError));
    }
  };

  const handlePhoneLogin = async ({ idToken, phoneNumber }) => {
    setError("");

    try {
      await phoneAuth(
        buildPhonePayload(
          {
            name: "",
            email: "",
            phoneNumber,
            alternatePhoneNumber: "",
            addressLine1: "",
            addressLine2: "",
            city: "",
            state: "",
            postalCode: "",
            gender: "",
            dateOfBirth: "",
            locationLabel: "",
            latitude: "",
            longitude: "",
          },
          idToken,
          phoneNumber,
        ),
      );
      navigate(redirectTo, { replace: true });
    } catch (phoneError) {
      setError(formatApiError(phoneError));
    }
  };

  return (
    <section className="container-shell py-8 sm:py-10 lg:py-10">
      <div className="mx-auto max-w-[1120px] overflow-hidden rounded-[18px] border border-[#e4ddd6] bg-white shadow-[0_20px_48px_rgba(42,28,18,0.07)] lg:grid lg:grid-cols-[0.98fr_1.02fr]">
        <div className="bg-white px-6 py-7 sm:px-9 sm:py-8 lg:px-10 lg:py-9">
          <div className="mx-auto max-w-[500px]">
            <div>
              <h1 className="text-[2.3rem] font-semibold tracking-[-0.03em] text-brand-dark sm:text-[2.7rem]">
                Login
              </h1>
              <p className="mt-2 text-[14px] leading-6 text-brand-dark/60">
                Do not have an account,{" "}
                <Link className="font-semibold text-brand-dark underline underline-offset-4" to="/signup">
                  create a new one.
                </Link>
              </p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block space-y-2.5">
                <span className="text-[13px] font-semibold text-brand-dark">
                  Enter Your Email
                </span>
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

              <label className="block space-y-2.5">
                <span className="text-[13px] font-semibold text-brand-dark">
                  Enter Your Password
                </span>
                <span className="relative block">
                  <input
                    required
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
              </label>

              {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full bg-[#2d2d2d] px-6 py-3.5 text-[14px] font-semibold text-white transition hover:bg-brand-primary disabled:opacity-60"
              >
                {isLoading ? "Logging in..." : "Login"}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  className="text-[14px] font-semibold text-brand-dark underline underline-offset-4"
                >
                  Forgot Your Password
                </button>
              </div>
            </form>

            <div className="mt-7 space-y-4 border-t border-[#eee5dd] pt-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-dark/45">
                Or continue with
              </p>

              <PhoneAuthPanel
                title="Continue with mobile OTP"
                description="Use your verified mobile number for faster sign-in."
                disabled={isLoading}
                onVerified={handlePhoneLogin}
                compact
              />
            </div>
          </div>
        </div>

        <div className="relative hidden min-h-[560px] border-l border-[#e8dfd6] lg:block">
          <img
            src={heroImage}
            alt="CandleOra candle arrangement"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[rgba(22,15,10,0.42)] via-[rgba(22,15,10,0.08)] to-[rgba(22,15,10,0.18)]" />
          <div className="absolute left-8 top-8 max-w-[320px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75 [text-shadow:0_2px_12px_rgba(0,0,0,0.28)]">
              CandleOra Access
            </p>
            <p className="mt-3 max-w-[290px] text-[1.05rem] font-semibold leading-6 text-white [text-shadow:0_4px_18px_rgba(0,0,0,0.34)]">
              Recover your cart and track orders with your CandleOra account.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Login;
