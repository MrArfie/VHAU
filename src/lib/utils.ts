import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Delimiter used to store multiple credential titles in one on-chain string. */
export const CREDENTIAL_TITLE_DELIMITER = " | ";

/** localStorage key for diploma image uploaded from device (keyed by tokenId). */
export const CREDENTIAL_IMAGE_STORAGE_KEY = "credentialImage_";

/** localStorage key for profile/avatar image (keyed by tokenId). */
export const PROFILE_IMAGE_STORAGE_KEY = "profileImage_";

/** Max size (chars) for a single image data URL before we skip or compress (localStorage ~5–10MB total). */
export const LOCAL_STORAGE_IMAGE_SOFT_LIMIT = 500_000;

/**
 * Compress an image file to a JPEG data URL (resized and reduced quality) to fit in localStorage.
 * @param file image file
 * @param maxDimension max width/height in pixels
 * @param quality JPEG quality 0–1
 */
export function compressImageFile(
  file: File,
  maxDimension = 1200,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.width;
      let h = img.height;
      if (w > maxDimension || h > maxDimension) {
        if (w > h) {
          h = Math.round((h * maxDimension) / w);
          w = maxDimension;
        } else {
          w = Math.round((w * maxDimension) / h);
          h = maxDimension;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to compress image"));
            return;
          }
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = () => reject(new Error("Failed to read compressed image"));
          r.readAsDataURL(blob);
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

/**
 * Save an image data URL to localStorage. On quota exceeded, tries compressed version if fallbackFile is provided.
 * @throws Error with user-friendly message if storage fails (e.g. "Storage full. Use a smaller image or clear other site data.")
 */
export async function saveImageToLocalStorage(
  key: string,
  dataUrl: string,
  fallbackFile?: File | null
): Promise<void> {
  const trySet = (value: string) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      if (e instanceof DOMException && (e.name === "QuotaExceededError" || e.code === 22)) {
        return false;
      }
      throw e;
    }
  };
  if (trySet(dataUrl)) return;
  if (fallbackFile) {
    const compressed = await compressImageFile(fallbackFile, 1000, 0.65);
    if (trySet(compressed)) return;
  }
  throw new Error(
    "Storage full. Use a smaller image, remove other credentials’ images from this browser, or clear site data."
  );
}

/** Delimiter used in metadataURI to store profile and diploma image URLs: "profileUrl|diplomaUrl". */
export const METADATA_IMAGE_DELIMITER = "|";

function isHttpUrl(s: string): boolean {
  const t = s.trim();
  return t.startsWith("http://") || t.startsWith("https://");
}

/**
 * Parse metadataURI into profile and diploma image URLs so images show on any device.
 * Format: "profileUrl|diplomaUrl" (either part can be empty). Single URL = diploma only.
 */
export function parseMetadataURIImages(metadataURI: string): {
  profileImageUrl?: string;
  diplomaImageUrl?: string;
} {
  const raw = (metadataURI || "").trim();
  if (!raw) return {};
  if (raw.includes(METADATA_IMAGE_DELIMITER)) {
    const [profile, diploma] = raw.split(METADATA_IMAGE_DELIMITER).map((s) => s.trim());
    return {
      ...(profile && isHttpUrl(profile) ? { profileImageUrl: profile } : {}),
      ...(diploma && isHttpUrl(diploma) ? { diplomaImageUrl: diploma } : {}),
    };
  }
  if (isHttpUrl(raw)) return { diplomaImageUrl: raw };
  return {};
}

/** Build metadataURI string from profile and diploma URLs (for on-chain storage). */
export function buildMetadataURIImages(profileImageUrl?: string | null, diplomaImageUrl?: string | null): string {
  const p = (profileImageUrl || "").trim();
  const d = (diplomaImageUrl || "").trim();
  return `${p}${METADATA_IMAGE_DELIMITER}${d}`;
}
