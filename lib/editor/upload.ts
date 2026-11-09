// Client helper for POST /api/uploads (studio only).

export type UploadedImage = { key: string; url: string; width: number; height: number };
export type UploadError = "UPLOAD_TOO_LARGE" | "UPLOAD_UNSUPPORTED" | "UPLOAD_RATE_LIMITED" | "UPLOAD_FAILED";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = "image/jpeg,image/png,image/webp";

export async function uploadImage(file: File): Promise<UploadedImage | { error: UploadError }> {
  if (file.size > MAX_UPLOAD_BYTES) return { error: "UPLOAD_TOO_LARGE" };
  const body = new FormData();
  body.append("file", file);
  try {
    const response = await fetch("/api/uploads", { method: "POST", body });
    if (response.status === 413) return { error: "UPLOAD_TOO_LARGE" };
    if (response.status === 415) return { error: "UPLOAD_UNSUPPORTED" };
    if (response.status === 429) return { error: "UPLOAD_RATE_LIMITED" };
    if (!response.ok) return { error: "UPLOAD_FAILED" };
    return (await response.json()) as UploadedImage;
  } catch {
    return { error: "UPLOAD_FAILED" };
  }
}
