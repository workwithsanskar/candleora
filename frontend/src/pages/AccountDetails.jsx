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
    <section className="container-shell py-14 sm:py-16">
      <div className="mx-auto max-w-[980px] space-y-8">
        <div className="space-y-3">
          <h1 className="text-heading-lg font-semibold uppercase tracking-[-0.02em] text-black">
            Account Details
          </h1>
          <p className="max-w-[920px] text-body leading-8 text-black/62">
            Update your saved contact details and delivery information from one clear overview.
          </p>
        </div>

        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-black">Profile Information</h2>
            <AccountProfileFields
              form={form}
              onChange={handleChange}
              onUseCurrentLocation={handleUseCurrentLocation}
              isLocating={isLocating}
              emailReadOnly
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-secondary min-w-[220px] rounded-full disabled:opacity-60"
            >
              {isSaving ? "Saving Changes..." : "Save Changes"}
            </button>

            <Link to="/profile" className="text-sm font-medium text-black/58 underline underline-offset-4">
              Back to overview
            </Link>
          </div>

          {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
          {successMessage && (
            <p className="text-sm font-semibold text-green-700">{successMessage}</p>
          )}
        </form>
      </div>
    </section>
  );
}

export default AccountDetails;
