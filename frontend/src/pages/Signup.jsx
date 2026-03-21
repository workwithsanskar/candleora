import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatApiError } from "../utils/format";

function Signup() {
  const navigate = useNavigate();
  const { signup, isLoading } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      await signup(form);
      navigate("/profile", { replace: true });
    } catch (signupError) {
      setError(formatApiError(signupError));
    }
  };

  return (
    <section className="container-shell py-10">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <form className="panel space-y-6 p-8" onSubmit={handleSubmit}>
          <div>
            <p className="eyebrow">Create account</p>
            <h1 className="mt-3 font-display text-4xl font-semibold text-brand-dark">
              Join CandleOra
            </h1>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-semibold text-brand-dark">Full name</span>
            <input
              required
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full rounded-2xl border border-brand-primary/15 bg-brand-secondary px-4 py-3 outline-none"
            />
          </label>

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
              minLength={8}
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
            className="rounded-full bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {isLoading ? "Creating account..." : "Create account"}
          </button>

          <p className="text-sm text-brand-dark/70">
            Already registered?{" "}
            <Link className="font-semibold text-brand-primary" to="/login">
              Sign in
            </Link>
          </p>
        </form>

        <div className="panel bg-brand-secondary p-8">
          <p className="eyebrow">Why create an account</p>
          <h2 className="mt-3 font-display text-5xl font-semibold text-brand-dark">
            Save orders, carts, and future gifting plans.
          </h2>
          <ul className="mt-6 space-y-4 text-sm leading-7 text-brand-dark/75">
            <li>Review order history and shipping details.</li>
            <li>Keep your cart synced with the backend API.</li>
            <li>Use checkout without re-entering basic customer details every time.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default Signup;
