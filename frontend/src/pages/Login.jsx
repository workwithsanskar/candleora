import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatApiError } from "../utils/format";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
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

  return (
    <section className="container-shell py-10">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="panel bg-brand-dark p-8 text-white">
          <p className="eyebrow text-brand-accent">Welcome back</p>
          <h1 className="mt-3 font-display text-5xl font-semibold">
            Sign in to continue your candle ritual.
          </h1>
          <p className="mt-5 text-sm leading-7 text-white/75">
            Access your saved cart, checkout securely, and review orders from your CandleOra profile.
          </p>
        </div>

        <form className="panel space-y-6 p-8" onSubmit={handleSubmit}>
          <div>
            <p className="eyebrow">Account</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-brand-dark">
              Login
            </h2>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-brand-dark">Email</span>
            <input
              required
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-2xl border border-brand-primary/15 bg-brand-secondary px-4 py-3 outline-none"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-brand-dark">Password</span>
            <input
              required
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-2xl border border-brand-primary/15 bg-brand-secondary px-4 py-3 outline-none"
            />
          </label>

          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-full bg-brand-dark px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary disabled:opacity-60"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>

          <p className="text-sm text-brand-dark/70">
            No account yet?{" "}
            <Link className="font-semibold text-brand-primary" to="/signup">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}

export default Login;
