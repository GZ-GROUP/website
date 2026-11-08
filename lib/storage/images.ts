import { randomUUID } from "node:crypto";
import sharp from "sharp";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_WIDTH = 2000;
const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp"]);

export type ProcessedImage = {
  key: string;
  data: Buffer;
  width: number;
  height: number;
  bytes: number;
  mimeType: "image/webp";
};

export type ImageError = "UNSUPPORTED_TYPE" | "TOO_LARGE" | "INVALID_IMAGE";

/**
 * Decodes the upload, then re-encodes it as WebP: honours EXIF orientation,
 * caps the width, and drops every metadata block (EXIF, GPS, ICC comments).
 * The file's real format is read from its bytes, never from its name or MIME.
 */
export async function processImage(input: Buffer): Promise<ProcessedImage | { error: ImageError }> {
  if (input.byteLength > MAX_UPLOAD_BYTES) return { error: "TOO_LARGE" };

  let format: string | undefined;
  try {
    format = (await sharp(input).metadata()).format;
  } catch {
    return { error: "INVALID_IMAGE" };
  }
  if (!format || !ACCEPTED_FORMATS.has(format)) return { error: "UNSUPPORTED_TYPE" };

  try {
    const { data, info } = await sharp(input, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    return {
      key: `articles/${randomUUID()}.webp`,
      data,
      width: info.width,
      height: info.height,
      bytes: info.size,
      mimeType: "image/webp",
    };
  } catch {
    return { error: "INVALID_IMAGE" };
  }
}
