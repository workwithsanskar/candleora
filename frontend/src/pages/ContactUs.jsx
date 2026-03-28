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

const fieldLabelClassName = "text-[0.82rem] font-semibold uppercase tracking-[0.08em] text-black/68";
const fieldInputClassName =
  "h-[56px] w-full rounded-[22px] border border-black/15 bg-white px-5 text-[0.98rem] text-black outline-none transition placeholder:text-black/32 focus:border-black";
const fieldTextareaClassName =
  "min-h-[108px] w-full rounded-[22px] border border-black/15 bg-white px-5 py-4 text-[0.98rem] text-black outline-none transition placeholder:text-black/32 focus:border-black";

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
      <section className="container-shell py-6 sm:py-8">
        <div className="mx-auto max-w-[1140px] overflow-hidden rounded-[18px] border border-black/10 bg-white shadow-candle">
          <div className="bg-black px-6 py-3.5 sm:px-8 lg:px-9">
            <h1 className="font-display text-heading-md font-semibold text-white">
              Get In Touch With Us
            </h1>
          </div>

          <div className="grid gap-5 px-6 py-5 sm:px-8 lg:grid-cols-[0.7fr_1.3fr] lg:gap-7 lg:px-9 lg:py-6">
            <div className="space-y-4">
              <div className="border-b border-black/10 pb-3">
                <p className="text-base font-medium text-black">Phone Number</p>
                <p className="mt-1 text-[0.98rem] leading-6 text-black/68">8999908639</p>
              </div>

              <div className="border-b border-black/10 pb-3">
                <p className="text-base font-medium text-black">Email Address</p>
                <p className="mt-1 text-[0.98rem] leading-6 text-black/68">candleora25@gmail.com</p>
              </div>

              <div>
                <p className="text-base font-medium text-black">Location</p>
                <p className="mt-1 max-w-[340px] text-[0.98rem] leading-6 text-black/68">
                  Nagpur, Maharashtra, India
                </p>
              </div>
            </div>

            <div>
              <div className="max-w-[620px]">
                <h2 className="font-display text-heading-md font-semibold text-black">
                  Send us a message
                </h2>
                <p className="mt-1.5 max-w-[620px] text-sm leading-6 text-black/62">
                  Have a question about an order, gifting, custom candles, or bulk enquiries? Send us a message and our team will get back to you shortly.
                </p>
                <p className="mt-2 text-[0.82rem] font-medium tracking-[0.02em] text-black/48">
                  All fields below are required so we can reach you properly.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1.5">
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
                  <label className="space-y-1.5">
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

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1.5">
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
                  <label className="space-y-1.5">
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

                <label className="space-y-1.5">
                  <span className={fieldLabelClassName}>Message *</span>
                  <textarea
                    rows="3"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Tell us about your order, gifting request, custom requirement, or question."
                    className={fieldTextareaClassName}
                  />
                </label>

                {error && <p className="text-sm font-semibold text-danger">{error}</p>}
                {statusMessage && <p className="text-sm font-semibold text-success">{statusMessage}</p>}

                <button type="submit" disabled={isSubmitting} className="btn btn-primary rounded-[12px] disabled:opacity-60">
                  {isSubmitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ContactUs;
