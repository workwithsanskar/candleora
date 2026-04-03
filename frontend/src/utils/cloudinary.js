export async function uploadProofToCloudinary(file) {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "candleora";

  if (!cloudName) {
    throw new Error("Cloudinary cloud name is not configured.");
  }

  if (!uploadPreset) {
    throw new Error("Cloudinary upload preset is not configured.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  let response;
  try {
    response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    throw new Error("Proof upload failed. Please check your internet or Cloudinary setup and try again.");
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.secure_url) {
    if (/upload preset not found/i.test(payload?.error?.message ?? "")) {
      throw new Error(
        `Cloudinary upload preset "${uploadPreset}" was not found. Add VITE_CLOUDINARY_UPLOAD_PRESET to frontend/.env with a valid unsigned preset, or create this preset in Cloudinary.`,
      );
    }

    throw new Error(
      payload?.error?.message ||
        "Proof upload failed. Please confirm the Cloudinary cloud name and upload preset are correct.",
    );
  }

  return payload;
}
