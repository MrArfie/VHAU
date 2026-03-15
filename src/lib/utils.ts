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
