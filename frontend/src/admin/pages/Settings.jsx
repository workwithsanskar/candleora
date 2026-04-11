import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import FiltersBar from "../components/FiltersBar";
import {
  FILTER_FIELD_CLASS,
  FILTER_LABEL_CLASS,
  PRIMARY_BUTTON_CLASS,
  SECONDARY_BUTTON_CLASS,
} from "../helpers";
import { useAuth } from "../../context/AuthContext";
import { formatApiError } from "../../utils/format";

const storeSettingItems = [
  "Shipping Rules",
  "Payment Settings",
  "Invoice Preferences",
  "Contact Support",
];

function Settings() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      name: user?.name ?? "",
      phoneNumber: user?.phoneNumber ?? "",
      city: user?.city ?? "",
      state: user?.state ?? "",
      country: user?.country ?? "",
      locationLabel: user?.locationLabel ?? "",
    },
  });

  useEffect(() => {
    reset({
      name: user?.name ?? "",
      phoneNumber: user?.phoneNumber ?? "",
      city: user?.city ?? "",
      state: user?.state ?? "",
      country: user?.country ?? "",
      locationLabel: user?.locationLabel ?? "",
    });
  }, [reset, user]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateProfile(values);
      toast.success("Admin settings updated.");
    } catch (error) {
      toast.error(formatApiError(error));
    }
  });

  return (
    <div className="space-y-6">
      <FiltersBar
        title="Admin Settings"
        description="Manage your account and store preferences"
      />

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-brand-muted">Profile Details</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-brand-dark">Profile Details</h2>
          </div>

          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <div className="flex flex-col gap-2">
              <label className={FILTER_LABEL_CLASS}>Name</label>
              <input className={FILTER_FIELD_CLASS} {...register("name")} />
            </div>

            <div className="flex flex-col gap-2">
              <label className={FILTER_LABEL_CLASS}>Email</label>
              <div className={`${FILTER_FIELD_CLASS} flex items-center bg-[#fbf7f0] text-brand-muted`}>
                {user?.email}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className={FILTER_LABEL_CLASS}>Phone</label>
              <input className={FILTER_FIELD_CLASS} {...register("phoneNumber")} />
            </div>

            <div className="flex flex-col gap-2">
              <label className={FILTER_LABEL_CLASS}>City</label>
              <input className={FILTER_FIELD_CLASS} {...register("city")} />
            </div>

            <div className="flex flex-col gap-2">
              <label className={FILTER_LABEL_CLASS}>State</label>
              <input className={FILTER_FIELD_CLASS} {...register("state")} />
            </div>

            <div className="flex flex-col gap-2">
              <label className={FILTER_LABEL_CLASS}>Country</label>
              <input className={FILTER_FIELD_CLASS} {...register("country")} />
            </div>

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className={FILTER_LABEL_CLASS}>Location Label</label>
              <input className={FILTER_FIELD_CLASS} {...register("locationLabel")} />
            </div>

            <div className="md:col-span-2">
              <button type="submit" className={PRIMARY_BUTTON_CLASS} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </section>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-brand-muted">Security</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-brand-dark">Security</h2>
            <p className="mt-3 text-sm leading-6 text-brand-muted">
              Change your account password to keep your account secure.
            </p>
            <button
              type="button"
              className={`mt-5 ${SECONDARY_BUTTON_CLASS}`}
              onClick={() => navigate(user?.email ? `/forgot-password?email=${encodeURIComponent(user.email)}` : "/forgot-password")}
            >
              Change Password
            </button>
          </section>

          <section className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.24em] text-brand-muted">Store Settings</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-brand-dark">Store Settings</h2>

            <div className="mt-5 divide-y divide-black/8 rounded-[22px] border border-black/8 bg-[#fbf7f0]">
              {storeSettingItems.map((item) => (
                <div key={item} className="flex items-center justify-between gap-3 px-4 py-4">
                  <span className="text-sm font-medium text-brand-dark">{item}</span>
                  <span className="text-sm text-brand-muted">Manage</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default Settings;
