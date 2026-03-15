/**
 * Upload an image to Cloudinary (unsigned preset). Images then show on any device via URL.
 * Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined;

export function isCloudinaryConfigured(): boolean {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
}

/**
 * Upload a file to Cloudinary. Returns the secure URL or null if not configured or upload fails.
 */
export async function uploadImageToCloudinary(file: File): Promise<string | null> {
  if (!CLOUD_NAME || !UPLOAD_PRESET) return null;
  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(url, { method: "POST", body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: { message?: string } }).error?.message || `Upload failed: ${res.status}`);
  }
  const data = (await res.json()) as { secure_url?: string };
  return data.secure_url || null;
}
