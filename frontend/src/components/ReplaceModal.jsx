import { Children, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import toast from "react-hot-toast";
import Modal from "./Modal";
import CandleSelectControl from "./CandleSelectControl";
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE_DISPLAY,
  SUPPORT_WHATSAPP_URL,
} from "../constants/support";
import { orderApi } from "../services/api";
import { uploadProofToCloudinary } from "../utils/cloudinary";
import { formatApiError } from "../utils/format";

const REPLACEMENT_REASONS = [
  "Damaged product",
  "Broken item",
  "Cracked jar",
  "Damaged in transit",
];

const MAX_PROOF_FILES = 4;
const ACCEPTED_PROOF_EXTENSIONS = ".jpg,.jpeg,.png,.mp4";
const ACCEPTED_PROOF_HELPER = "Max 4 files - JPG, PNG, MP4";

function buildReplacementErrorContent(errorMessage) {
  if (!errorMessage) {
    return null;
  }

  if (/backend may be unavailable|waking up/i.test(errorMessage)) {
    return {
      title: "CandleOra is waking up",
      detail:
        "Please wait a few seconds and tap Submit again. Your form and selected proof files are still here.",
    };
  }

  return {
    title: "We couldn't submit this request",
    detail: errorMessage,
  };
}

function fileKey(file) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function isSupportedProofFile(file) {
  const type = String(file?.type ?? "").toLowerCase();
  const name = String(file?.name ?? "").toLowerCase();

  return (
    type === "image/jpeg" ||
    type === "image/png" ||
    type === "video/mp4" ||
    name.endsWith(".jpg") ||
    name.endsWith(".jpeg") ||
    name.endsWith(".png") ||
    name.endsWith(".mp4")
  );
}

function isVideoProofFile(file) {
  const type = String(file?.type ?? "").toLowerCase();
  const name = String(file?.name ?? "").toLowerCase();

  return type.startsWith("video/") || name.endsWith(".mp4");
}

function RequiredLabel({ children }) {
  return (
    <span className="text-sm font-semibold text-brand-dark">
      {children} <span className="text-[#c46b00]">*</span>
    </span>
  );
}

function CandleSelect({
  label,
  required = false,
  value,
  onChange,
  buttonClassName = "",
  children,
}) {
  const options = useMemo(
    () =>
      Children.toArray(children)
        .map((child) => {
          if (!child || !child.props) {
            return null;
          }

          const labelText =
            typeof child.props.children === "string"
              ? child.props.children
              : String(child.props.children ?? "");

          return {
            value: child.props.value,
            label: labelText,
          };
        })
        .filter(Boolean),
    [children],
  );

  return (
    <div className="space-y-2">
      {required ? (
        <RequiredLabel>{label}</RequiredLabel>
      ) : (
        <span className="text-sm font-semibold text-brand-dark">{label}</span>
      )}
      <CandleSelectControl
        value={value ?? ""}
        onChange={onChange}
        options={options}
        placeholder={options[0]?.label ?? "Select"}
        buttonClassName={buttonClassName}
      />
    </div>
  );
}

function ReplaceModal({ isOpen, onClose, orderId, item, items, onSuccess }) {
  const fileInputRef = useRef(null);
  const eligibleItems = useMemo(() => {
    if (Array.isArray(items) && items.length > 0) {
      return items;
    }

    return item ? [item] : [];
  }, [item, items]);

  const [reason, setReason] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [selectedItemId, setSelectedItemId] = useState(item?.id ?? items?.[0]?.id ?? null);
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("form");

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    setReason("");
    setCustomerNote("");
    setSelectedItemId(item?.id ?? eligibleItems[0]?.id ?? null);
    setFiles([]);
    setError("");
    setIsUploading(false);
    setIsSubmitting(false);
    setView("form");

    return undefined;
  }, [isOpen, item?.id, items?.[0]?.id, items?.length]);

  const selectedItem = useMemo(
    () =>
      eligibleItems.find((entry) => String(entry?.id) === String(selectedItemId)) ??
      eligibleItems[0] ??
      null,
    [eligibleItems, selectedItemId],
  );

  const selectedFileSummary = files.length
    ? `${files.length} of ${MAX_PROOF_FILES} file${MAX_PROOF_FILES === 1 ? "" : "s"} added`
    : ACCEPTED_PROOF_HELPER;
  const canSubmit =
    Boolean(selectedItem?.id && reason && files.length) && !isSubmitting && !isUploading;
  const errorContent = useMemo(() => buildReplacementErrorContent(error), [error]);

  function handleFilesSelected(event) {
    const nextFiles = Array.from(event.target.files ?? []);

    if (!nextFiles.length) {
      return;
    }

    const supportedFiles = nextFiles.filter(isSupportedProofFile);
    const hasUnsupportedFiles = supportedFiles.length !== nextFiles.length;
    let reachedLimit = false;

    setFiles((current) => {
      const existingKeys = new Set(current.map(fileKey));
      const merged = [...current];

      supportedFiles.forEach((nextFile) => {
        const nextKey = fileKey(nextFile);

        if (!existingKeys.has(nextKey)) {
          merged.push(nextFile);
          existingKeys.add(nextKey);
        }
      });

      if (merged.length > MAX_PROOF_FILES) {
        reachedLimit = true;
      }

      return merged.slice(0, MAX_PROOF_FILES);
    });

    if (hasUnsupportedFiles) {
      setError("Only JPG, PNG, or MP4 files are supported.");
    } else if (reachedLimit) {
      setError(`You can upload up to ${MAX_PROOF_FILES} proof files.`);
    } else {
      setError("");
    }

    event.target.value = "";
  }

  function removeSelectedFile(targetKey) {
    setFiles((current) => current.filter((entry) => fileKey(entry) !== targetKey));
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedItem?.id) {
      setError("Choose a product before creating a replacement request.");
      return;
    }

    if (!reason) {
      setError("Select a reason before continuing.");
      return;
    }

    if (!files.length) {
      setError("Add photo or video proof before continuing.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      setIsUploading(true);
      const uploadPayloads = await Promise.all(files.map((file) => uploadProofToCloudinary(file)));
      const proofAssetUrls = uploadPayloads.map((payload) => payload.secure_url).filter(Boolean);
      const proofImageUrl = proofAssetUrls[0] ?? "";

      await orderApi.createReplacement(orderId, {
        orderItemId: selectedItem.id,
        reason,
        proofImageUrl,
        proofAssetUrls,
        customerNote,
      });

      toast.success("Replacement request submitted.");
      await onSuccess?.();
      setView("success");
    } catch (submitError) {
      setError(formatApiError(submitError));
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={view === "success" ? "Replacement submitted" : "Replacement request"}
      description=""
      maxWidthClass="max-w-[640px]"
      bodyScrollable={false}
      headerClassName="!px-4 !py-3 sm:!px-5 sm:!py-3.5"
      titleClassName="text-[clamp(1.45rem,3.8vw,1.9rem)] leading-[1]"
      bodyClassName="!px-4 !py-4 sm:!px-5 sm:!py-5"
    >
      {view === "success" ? (
        <div className="space-y-4">
          <div className="rounded-[28px] bg-[linear-gradient(135deg,#fff8ec_0%,#fffef9_100%)] px-5 py-6">
            <p className="text-[1.45rem] font-semibold leading-none text-brand-dark">
              Request received
            </p>
            <p className="mt-3 text-sm leading-7 text-black/60">
              We received the replacement request for {selectedItem?.productName ?? "your item"}.
            </p>
          </div>

          <p className="text-sm leading-7 text-black/58">
            If we need anything else, we will follow up on WhatsApp or email.
          </p>

          <div className="flex justify-end">
            <button type="button" className="checkout-action-primary min-w-[120px]" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit}>
          {eligibleItems.length > 1 ? (
            <CandleSelect
              label="Product"
              value={selectedItemId ?? ""}
              onChange={(nextValue) => {
                setSelectedItemId(nextValue);
                setError("");
              }}
              buttonClassName="!h-[52px] !rounded-[18px] !bg-white"
            >
              {eligibleItems.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.productName} - Qty {option.quantity}
                </option>
              ))}
            </CandleSelect>
          ) : null}

          <section className="rounded-[26px] bg-[linear-gradient(135deg,#fff8ec_0%,#fffef9_100%)] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/42">
              Product
            </p>
            <p className="mt-1.5 text-[1.05rem] font-semibold leading-6 text-brand-dark">
              {selectedItem?.productName ?? "Order item"}
            </p>
            <p className="mt-1 text-sm text-black/56">Qty: {selectedItem?.quantity ?? 1}</p>
          </section>

          <CandleSelect
            label="Reason"
            required
            value={reason}
            onChange={(nextValue) => {
              setReason(nextValue);
              setError("");
            }}
            buttonClassName="!h-[52px] !rounded-[18px] !bg-white"
          >
            <option value="">Select reason</option>
            {REPLACEMENT_REASONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </CandleSelect>

          <section className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <RequiredLabel>Upload photos / videos</RequiredLabel>
              <span className="text-[11px] font-medium text-black/44">
                {ACCEPTED_PROOF_HELPER}
              </span>
            </div>

            <button
              type="button"
              className="flex w-full flex-col items-center justify-center rounded-[28px] border border-dashed border-[#f1c979] bg-[#fffaf4] px-5 py-6 text-center transition hover:border-[#e0aa44] hover:bg-[#fff6e8]"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#a86a00] shadow-[0_10px_24px_rgba(241,184,90,0.2)]">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M12 16V7" strokeLinecap="round" />
                  <path
                    d="M8.5 10.5L12 7L15.5 10.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M6 17.5H18" strokeLinecap="round" />
                </svg>
              </span>
              <span className="mt-3 text-sm font-semibold text-brand-dark">
                {files.length ? "Add more files" : "Add photos"}
              </span>
              <span className="mt-1 text-xs leading-6 text-black/54">{selectedFileSummary}</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_PROOF_EXTENSIONS}
              onChange={handleFilesSelected}
              className="hidden"
            />

            {files.length ? (
              <div className="overflow-hidden rounded-[22px] border border-black/8 bg-white">
                <div className="border-b border-black/6 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/42">
                    Uploaded files
                  </p>
                </div>
                <div className="divide-y divide-black/6">
                  {files.map((file) => {
                    const isVideo = isVideoProofFile(file);

                    return (
                      <div key={fileKey(file)} className="flex items-center gap-3 px-4 py-3">
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fff7e8] text-[#a86a00]">
                          {isVideo ? (
                            <svg
                              viewBox="0 0 24 24"
                              className="h-4.5 w-4.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            >
                              <rect x="4" y="6" width="11" height="12" rx="2" />
                              <path d="M15 10L20 7.5V16.5L15 14" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <svg
                              viewBox="0 0 24 24"
                              className="h-4.5 w-4.5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                            >
                              <rect x="4" y="5" width="16" height="14" rx="2" />
                              <circle cx="9" cy="10" r="1.5" />
                              <path d="M6.5 16L11.2 11.3C11.6 10.9 12.2 10.9 12.6 11.3L14.2 12.9" />
                              <path d="M13.4 12.1L15.3 10.2C15.7 9.8 16.3 9.8 16.7 10.2L19 12.5" />
                            </svg>
                          )}
                        </span>

                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-brand-dark">
                          {file.name}
                        </p>

                        <button
                          type="button"
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#c63d3d] transition hover:bg-[#fff3f3]"
                          onClick={() => removeSelectedFile(fileKey(file))}
                          aria-label={`Remove ${file.name}`}
                        >
                          <svg
                            viewBox="0 0 16 16"
                            className="h-3.5 w-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          >
                            <path d="M4 4L12 12" strokeLinecap="round" />
                            <path d="M12 4L4 12" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-brand-dark">Additional note</span>
            <textarea
              value={customerNote}
              onChange={(event) => setCustomerNote(event.target.value)}
              className="checkout-textarea stealth-scrollbar min-h-[104px] resize-none overflow-y-auto !rounded-[18px] !px-4 !py-3"
              placeholder="Write here..."
            />
          </label>

          <p className="text-sm leading-6 text-black/58">
            You can also share this on{" "}
            <a
              href={SUPPORT_WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-brand-dark underline underline-offset-4"
              aria-label={`Open WhatsApp chat with CandleOra at ${SUPPORT_PHONE_DISPLAY}`}
            >
              WhatsApp
            </a>{" "}
            or{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="font-semibold text-brand-dark underline underline-offset-4"
              aria-label={`Email CandleOra at ${SUPPORT_EMAIL}`}
            >
              Email
            </a>
            .
          </p>

          <div className="border-t border-black/8 pt-4">
            {errorContent ? (
              <div className="mb-4 flex items-start gap-2.5 rounded-[18px] border border-[#efc3c3] bg-[#fff6f6] px-3 py-2.5">
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ffe6e6] text-[#cf4b4b]">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M12 8V13" strokeLinecap="round" />
                    <path d="M12 17H12.01" strokeLinecap="round" />
                    <path
                      d="M10.7 3.7L2.9 17.2C2.3 18.2 3 19.5 4.2 19.5H19.8C21 19.5 21.7 18.2 21.1 17.2L13.3 3.7C12.7 2.8 11.3 2.8 10.7 3.7Z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold leading-5 text-[#c63d3d]">
                    {errorContent.title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-[18px] text-[#9e4d4d]">
                    {errorContent.detail}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="checkout-action-secondary min-w-[120px]"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="checkout-action-primary min-w-[120px]"
                disabled={!canSubmit}
              >
                {isUploading ? "Uploading..." : isSubmitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}

ReplaceModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  orderId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  item: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    productName: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    quantity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      productName: PropTypes.string,
      price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      quantity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    }),
  ),
  onSuccess: PropTypes.func,
};

ReplaceModal.defaultProps = {
  item: null,
  items: [],
  onSuccess: null,
};

export default ReplaceModal;
