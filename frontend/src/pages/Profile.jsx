import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatusView from "../components/StatusView";
import { useAuth } from "../context/AuthContext";
import { formatApiError } from "../utils/format";

function Profile() {
  const { user, refreshProfile } = useAuth();
  const [profile, setProfile] = useState(user);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setProfile(user);
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      return undefined;
    }

    let isMounted = true;

    refreshProfile()
      .then((response) => {
        if (isMounted) {
          setProfile(response);
        }
      })
      .catch((profileError) => {
        if (isMounted) {
          setError(formatApiError(profileError));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [profile, refreshProfile]);

  if (error) {
    return (
      <section className="container-shell py-16">
        <StatusView title="Profile unavailable" message={error} />
      </section>
    );
  }

  return (
    <section className="container-shell space-y-8 py-10">
      <div className="panel grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="eyebrow">Profile</p>
          <h1 className="mt-3 font-display text-5xl font-semibold text-brand-dark">
            {profile?.name ?? "CandleOra customer"}
          </h1>
          <p className="mt-4 text-sm leading-7 text-brand-dark/70">
            {profile?.email ?? "Your account details will appear here after sign-in."}
          </p>
        </div>
        <div className="rounded-[28px] bg-brand-secondary px-6 py-5 text-sm font-semibold text-brand-dark">
          Role: {profile?.role ?? "USER"}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link to="/orders" className="panel p-6">
          <p className="eyebrow">Orders</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-brand-dark">
            Review your order history
          </h2>
          <p className="mt-3 text-sm leading-7 text-brand-dark/70">
            Track previous CandleOra purchases and view the products included in each order.
          </p>
        </Link>

        <Link to="/shop" className="panel p-6">
          <p className="eyebrow">Continue shopping</p>
          <h2 className="mt-3 font-display text-3xl font-semibold text-brand-dark">
            Browse new arrivals and gifting edits
          </h2>
          <p className="mt-3 text-sm leading-7 text-brand-dark/70">
            Return to the store to explore best sellers, occasion picks, and product details.
          </p>
        </Link>
      </div>
    </section>
  );
}

export default Profile;
