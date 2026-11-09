import { MAX_UPLOAD_BYTES } from "@/lib/storage/images";

type Rejected = { status: 400 | 413; error: "INVALID_IMAGE" | "TOO_LARGE" };

/** Reads the `file` field of a multipart upload, refusing oversized bodies early. */
export async function readUploadedFile(request: Request): Promise<{ buffer: Buffer } | Rejected> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024) return { status: 413, error: "TOO_LARGE" };

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return { status: 400, error: "INVALID_IMAGE" };
  }
  if (!(file instanceof File)) return { status: 400, error: "INVALID_IMAGE" };
  if (file.size > MAX_UPLOAD_BYTES) return { status: 413, error: "TOO_LARGE" };
  return { buffer: Buffer.from(await file.arrayBuffer()) };
}
