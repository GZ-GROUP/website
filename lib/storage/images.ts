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

export const AVATAR_SIZE = 512;

/** Article images: full frame, width capped. */
export function processImage(input: Buffer) {
  return encode(input, "articles", (image) => image.resize({ width: MAX_WIDTH, withoutEnlargement: true }));
}

/** Profile photos: a square, cropped around the most interesting part of the picture. */
export function processAvatar(input: Buffer) {
  return encode(input, "avatars", (image) =>
    image.resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: sharp.strategy.attention }),
  );
}

/**
 * Decodes the upload, then re-encodes it as WebP: honours EXIF orientation,
 * applies `resize`, and drops every metadata block (EXIF, GPS, ICC comments).
 * The file's real format is read from its bytes, never from its name or MIME.
 */
async function encode(
  input: Buffer,
  folder: "articles" | "avatars",
  resize: (image: ReturnType<typeof sharp>) => ReturnType<typeof sharp>,
): Promise<ProcessedImage | { error: ImageError }> {
  if (input.byteLength > MAX_UPLOAD_BYTES) return { error: "TOO_LARGE" };

  let format: string | undefined;
  try {
    format = (await sharp(input).metadata()).format;
  } catch {
    return { error: "INVALID_IMAGE" };
  }
  if (!format || !ACCEPTED_FORMATS.has(format)) return { error: "UNSUPPORTED_TYPE" };

  try {
    const { data, info } = await resize(sharp(input, { limitInputPixels: 40_000_000 }).rotate())
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    return {
      key: `${folder}/${randomUUID()}.webp`,
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
