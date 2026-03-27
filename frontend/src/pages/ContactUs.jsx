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
      <section className="container-shell py-8 sm:py-10">
        <div className="mx-auto max-w-[1180px] overflow-hidden rounded-[18px] border border-black/10 bg-white shadow-candle">
          <div className="bg-black px-6 py-4 sm:px-8 lg:px-10">
            <h1 className="font-display text-heading-md font-semibold text-white">
              Get In Touch With Us
            </h1>
          </div>

          <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-8 lg:px-10 lg:py-8">
            <div className="space-y-5">
              <div className="border-b border-black/10 pb-4">
                <p className="text-base font-medium text-black">Phone Number</p>
                <p className="mt-1.5 text-[0.98rem] leading-6 text-black/68">8999908639</p>
              </div>

              <div className="border-b border-black/10 pb-4">
                <p className="text-base font-medium text-black">Email Address</p>
                <p className="mt-1.5 text-[0.98rem] leading-6 text-black/68">candleora25@gmail.com</p>
              </div>

              <div>
                <p className="text-base font-medium text-black">Location</p>
                <p className="mt-1.5 max-w-[360px] text-[0.98rem] leading-6 text-black/68">
                  Nagpur, Maharashtra, India
                </p>
              </div>
            </div>

            <div>
              <div className="max-w-[620px]">
                <h2 className="font-display text-heading-md font-semibold text-black">
                  Send us a message
                </h2>
                <p className="mt-2 max-w-[620px] text-sm leading-6 text-black/62">
                  Have a question about an order, gifting, custom candles, or bulk enquiries? Send us a message and our team will get back to you shortly.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your Name"
                    className="input-pill"
                  />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Your E-mail"
                    className="input-pill"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Phone Number"
                    className="input-pill"
                  />
                  <input
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    placeholder="Subject"
                    className="input-pill"
                  />
                </div>

                <textarea
                  rows="4"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Message"
                  className="min-h-[132px] w-full rounded-[24px] border border-black/15 px-5 py-4 text-sm text-black outline-none transition placeholder:text-black/35 focus:border-black"
                />

                {error && <p className="text-sm font-semibold text-danger">{error}</p>}
                {statusMessage && <p className="text-sm font-semibold text-success">{statusMessage}</p>}

                <button type="submit" disabled={isSubmitting} className="btn btn-primary disabled:opacity-60">
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
