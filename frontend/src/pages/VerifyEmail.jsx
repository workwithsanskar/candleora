import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import StatusView from "../components/StatusView";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../services/api";
import { formatApiError } from "../utils/format";

function VerifyEmail() {
  const { refreshProfile, isAuthenticated } = useAuth();
  const [params] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = params.get("token");

    if (!token) {
      setError("Verification link is missing a token.");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    authApi
      .verifyEmail({ token })
      .then(async () => {
        if (!isMounted) {
          return;
        }

        if (isAuthenticated) {
          try {
            await refreshProfile();
          } catch {
            // The verification result is already persisted on the backend.
          }
        }
      })
      .catch((verificationError) => {
        if (isMounted) {
          setError(formatApiError(verificationError));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, params, refreshProfile]);

  if (isLoading) {
    return (
      <section className="container-shell py-16">
        <StatusView
          title="Verifying email"
          message="We are confirming your CandleOra email address now."
        />
      </section>
    );
  }

  if (error) {
    return (
      <section className="container-shell py-16">
        <StatusView
          title="Email verification unavailable"
          message={error}
          action={
            <Link to="/profile" className="btn btn-secondary mt-6">
              Back to profile
            </Link>
          }
        />
      </section>
    );
  }

  return (
    <section className="container-shell py-16">
      <StatusView
        title="Email verified"
        message="Your CandleOra email has been confirmed. You can continue with checkout or return to your account."
        action={
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/checkout" className="btn btn-secondary">
              Continue to checkout
            </Link>
            <Link to="/profile" className="btn btn-outline">
              Back to profile
            </Link>
          </div>
        }
      />
    </section>
  );
}

export default VerifyEmail;
