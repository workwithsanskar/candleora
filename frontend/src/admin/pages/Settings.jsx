import { useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import FiltersBar from "../components/FiltersBar";
import { FILTER_FIELD_CLASS, FILTER_LABEL_CLASS, PRIMARY_BUTTON_CLASS } from "../helpers";
import { useAuth } from "../../context/AuthContext";
import { formatApiError } from "../../utils/format";

function Settings() {
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
      toast.success("Admin profile updated.");
    } catch (error) {
      toast.error(formatApiError(error));
    }
  });

  return (
    <div className="space-y-6">
      <FiltersBar
        title="Admin settings"
        description="Manage the account identity that controls CandleOra operations today, with room to layer store-wide settings later."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-brand-muted">Profile</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-brand-dark">Admin identity</h2>
          </div>

          <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className={FILTER_LABEL_CLASS}>Email</label>
              <div className={`${FILTER_FIELD_CLASS} flex items-center bg-[#fbf7f0] text-brand-muted`}>
                {user?.email}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className={FILTER_LABEL_CLASS}>Name</label>
              <input className={FILTER_FIELD_CLASS} {...register("name")} />
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

            <div className="flex flex-col gap-2">
              <label className={FILTER_LABEL_CLASS}>Location label</label>
              <input className={FILTER_FIELD_CLASS} {...register("locationLabel")} />
            </div>

            <div className="md:col-span-2">
              <button type="submit" className={PRIMARY_BUTTON_CLASS} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-4 rounded-[28px] border border-black/10 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-brand-muted">Store controls</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-brand-dark">Future-ready settings</h2>
          </div>

          <div className="rounded-[22px] border border-black/8 bg-[#fbf7f0] p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-dark">Password management</h3>
            <p className="mt-2 text-sm leading-6 text-brand-muted">
              Password rotation should be handled with a dedicated authenticated endpoint before we expose it in the admin UI.
            </p>
          </div>

          <div className="rounded-[22px] border border-black/8 bg-[#fbf7f0] p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-dark">Store configuration</h3>
            <p className="mt-2 text-sm leading-6 text-brand-muted">
              Shipping rules, invoice defaults, and payment toggles can be layered here once those settings are persisted by the backend.
            </p>
          </div>

          <div className="rounded-[22px] border border-black/8 bg-[#17120f] p-4 text-white">
            <p className="text-xs uppercase tracking-[0.24em] text-[#c8a96f]">Current role</p>
            <p className="mt-2 font-display text-2xl font-semibold">{user?.role}</p>
            <p className="mt-2 text-sm leading-6 text-white/72">
              This account can access protected admin routes and API endpoints guarded by the `ADMIN` role.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Settings;
