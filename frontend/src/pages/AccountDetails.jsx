import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AccountProfileFields from "../components/AccountProfileFields";
import StatusView from "../components/StatusView";
import { useAuth } from "../context/AuthContext";
import { buildProfilePayload, createAccountForm } from "../utils/account";
import { formatApiError } from "../utils/format";
import { getCurrentLocation } from "../utils/location";

function AccountDetails() {
  const { user, refreshProfile, updateProfile } = useAuth();
  const [profile, setProfile] = useState(user);
  const [form, setForm] = useState(() => createAccountForm(user));
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(!user);

  useEffect(() => {
    if (user) {
      setProfile(user);
      setForm(createAccountForm(user));
      setIsRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      return undefined;
    }

    let isMounted = true;
    setIsRefreshing(true);

    refreshProfile()
      .then((response) => {
        if (isMounted) {
          setProfile(response);
          setForm(createAccountForm(response));
        }
      })
      .catch((profileError) => {
        if (isMounted) {
          setError(formatApiError(profileError));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsRefreshing(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [profile, refreshProfile]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleUseCurrentLocation = async () => {
    setError("");
    setSuccessMessage("");
    setIsLocating(true);

    try {
      const location = await getCurrentLocation();
      setForm((current) => ({
        ...current,
        locationLabel: current.locationLabel || location.locationLabel,
        latitude: String(location.latitude),
        longitude: String(location.longitude),
      }));
    } catch (locationError) {
      setError(formatApiError(locationError));
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsSaving(true);

    try {
      const updatedUser = await updateProfile(buildProfilePayload(form));
      setProfile(updatedUser);
      setForm(createAccountForm(updatedUser));
      setSuccessMessage("Profile updated successfully.");
    } catch (profileError) {
      setError(formatApiError(profileError));
    } finally {
      setIsSaving(false);
    }
  };

  if (error && !profile) {
    return (
      <section className="container-shell py-16">
        <StatusView title="Profile unavailable" message={error} />
      </section>
    );
  }

  if (isRefreshing && !profile) {
    return (
      <section className="container-shell py-16">
        <StatusView title="Loading profile" message="Fetching your CandleOra account details." />
      </section>
    );
  }

  return (
    <section className="container-shell space-y-8 py-10 sm:py-12">
      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.14em] text-brand-dark/45">
          User Account
        </p>
        <h1 className="text-[2.7rem] font-semibold tracking-[-0.04em] text-brand-dark">
          ACCOUNT DETAILS
        </h1>
        <p className="max-w-3xl text-base leading-8 text-brand-dark/62">
          Update your saved contact details, delivery information, and account profile in one place.
        </p>
      </div>

      <form className="panel space-y-6 p-6 sm:p-8" onSubmit={handleSubmit}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Manage profile</p>
            <h2 className="mt-3 font-display text-4xl font-semibold text-brand-dark">
              {profile?.name ?? "CandleOra customer"}
            </h2>
            <p className="mt-3 text-sm leading-7 text-brand-dark/70">
              {profile?.email ?? "Your account details are available after sign-in."}
            </p>
          </div>

          <Link
            to="/profile"
            className="rounded-full border border-[#d8d2cb] px-5 py-3 text-sm font-semibold text-brand-dark transition hover:border-brand-dark"
          >
            Back to overview
          </Link>
        </div>

        <div id="addresses" className="space-y-6">
          <AccountProfileFields
            form={form}
            onChange={handleChange}
            onUseCurrentLocation={handleUseCurrentLocation}
            isLocating={isLocating}
            emailReadOnly
          />
        </div>

        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        {successMessage && (
          <p className="text-sm font-semibold text-green-700">{successMessage}</p>
        )}

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-full bg-brand-dark px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-primary disabled:opacity-60"
        >
          {isSaving ? "Saving profile..." : "Save profile"}
        </button>
      </form>
    </section>
  );
}

export default AccountDetails;
