import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { contentApi } from "../services/api";
import { formatApiError } from "../utils/format";
import { clearStoredJson, readStoredJson, writeStoredJson } from "../utils/storage";

const CONTACT_DRAFT_STORAGE_KEY = "candleora.contact-draft";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

const fieldLabelClassName =
  "text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-black/68";
const fieldInputClassName =
  "h-[48px] w-full rounded-[20px] border border-black/15 bg-white px-6 py-2.5 text-[0.94rem] text-black outline-none transition placeholder:text-black/32 focus:border-black";
const fieldTextareaClassName =
  "min-h-[76px] w-full rounded-[20px] border border-black/15 bg-white px-6 py-3.5 text-[0.94rem] text-black outline-none transition placeholder:text-black/32 focus:border-black";

function buildInitialForm(user) {
  return {
    ...emptyForm,
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  };
}

function ContactUs() {
  const { user } = useAuth();
  const [form, setForm] = useState(() => buildInitialForm(user));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [hasHydratedDraft, setHasHydratedDraft] = useState(false);

  useEffect(() => {
    const savedDraft = readStoredJson(CONTACT_DRAFT_STORAGE_KEY, null);

    if (savedDraft) {
      setForm((current) => ({
        ...current,
        ...savedDraft,
      }));
    } else {
      setForm(buildInitialForm(user));
    }

    setHasHydratedDraft(true);
  }, [user]);

  useEffect(() => {
    if (!hasHydratedDraft) {
      return;
    }

    writeStoredJson(CONTACT_DRAFT_STORAGE_KEY, form);
  }, [form, hasHydratedDraft]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setStatusMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedForm = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, String(value ?? "").trim()]),
    );

    if (
      !trimmedForm.name ||
      !trimmedForm.email ||
      !trimmedForm.phone ||
      !trimmedForm.subject ||
      !trimmedForm.message
    ) {
      setError("Please fill in all fields before sending your message.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setStatusMessage("");

    try {
      await contentApi.submitContactMessage(trimmedForm);
      clearStoredJson(CONTACT_DRAFT_STORAGE_KEY);
      setForm(buildInitialForm(user));
      setStatusMessage("Your message has been sent successfully. Our team will get back to you shortly.");
      toast.success("Message sent successfully.");
    } catch (submitError) {
      const message = formatApiError(submitError);
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white">
      <section className="mx-auto w-full max-w-[1520px] px-4 py-2.5 sm:px-6 sm:py-3.5 lg:px-10 lg:py-4">
        <div className="overflow-hidden rounded-[18px] border border-black/10 bg-white shadow-candle">
          <div className="bg-black px-6 py-2.5 sm:px-8 lg:px-10 lg:py-3">
            <h1 className="font-display text-[1.8rem] font-semibold leading-[1.05] text-white sm:text-[1.95rem]">
              Get In Touch With Us
            </h1>
          </div>

          <div className="grid gap-3.5 px-6 py-3.5 sm:px-8 lg:grid-cols-[0.52fr_1.48fr] lg:gap-7 lg:px-10 lg:py-4">
            <div className="space-y-2.5 pt-0.5">
              <div className="border-b border-black/10 pb-2">
                <p className="text-[0.98rem] font-medium text-black">Phone Number</p>
                <p className="mt-0.5 text-[0.92rem] leading-5 text-black/68">8999908639</p>
              </div>

              <div className="border-b border-black/10 pb-2">
                <p className="text-[0.98rem] font-medium text-black">Email Address</p>
                <p className="mt-0.5 text-[0.93rem] leading-5.5 text-black/68">
                  candleora25@gmail.com
                </p>
              </div>

              <div>
                <p className="text-[0.98rem] font-medium text-black">Location</p>
                <p className="mt-0.5 max-w-[360px] text-[0.92rem] leading-5 text-black/68">
                  Nagpur, Maharashtra, India
                </p>
              </div>
            </div>

            <div>
              <div className="max-w-[840px]">
                <h2 className="font-display text-[1.7rem] font-semibold leading-[1.05] text-black sm:text-[1.85rem]">
                  Send us a message
                </h2>
                <p className="mt-0.5 max-w-[760px] text-[0.9rem] leading-5 text-black/62">
                  Have a question about an order, gifting, custom candles, or bulk enquiries? Send us a message and our team will get back to you shortly.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-2.5 rounded-[22px] border border-black/8 bg-[#fffdfa] p-3.5 sm:p-4 lg:p-4.5"
              >
                <div className="space-y-2.5">
                <div className="grid gap-2.5 md:grid-cols-2">
                  <label className="space-y-0.5">
                    <span className={fieldLabelClassName}>Your name *</span>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      className={fieldInputClassName}
                    />
                  </label>
                  <label className="space-y-0.5">
                    <span className={fieldLabelClassName}>Email address *</span>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="Enter your email address"
                      className={fieldInputClassName}
                    />
                  </label>
                </div>

                <div className="grid gap-2.5 md:grid-cols-2">
                  <label className="space-y-0.5">
                    <span className={fieldLabelClassName}>Phone number *</span>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Enter your mobile number"
                      className={fieldInputClassName}
                    />
                  </label>
                  <label className="space-y-0.5">
                    <span className={fieldLabelClassName}>Subject *</span>
                    <input
                      type="text"
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      placeholder="What do you need help with?"
                      className={fieldInputClassName}
                    />
                  </label>
                </div>

                <label className="space-y-0.5">
                  <span className={fieldLabelClassName}>Message *</span>
                  <textarea
                    rows="2"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us about your order, gifting request, custom requirement, or question."
                    className={fieldTextareaClassName}
                  />
                </label>

                {error && <p className="text-sm font-semibold text-danger">{error}</p>}
                {statusMessage && <p className="text-sm font-semibold text-success">{statusMessage}</p>}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary rounded-[12px] px-7 py-2.5 text-[0.94rem] disabled:opacity-60"
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ContactUs;
