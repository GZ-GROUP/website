import { auth } from "@/lib/auth";
import { canUseStudio } from "@/lib/articles/permissions";
import { prisma } from "@/lib/db";
import { mediaUrl } from "@/lib/editor/links";
import { putObject } from "@/lib/storage/s3";
import { MAX_UPLOAD_BYTES, processImage } from "@/lib/storage/images";

const json = (status: number, body: object) => Response.json(body, { status });

/** Image upload for the studio (writers and admins only). */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  // Same answer as a missing route: the studio's existence is not revealed.
  if (!session || session.user.mustChangePassword || !canUseStudio(session.user)) {
    return json(404, { error: "NOT_FOUND" });
  }

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_UPLOAD_BYTES + 64 * 1024) return json(413, { error: "TOO_LARGE" });

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return json(400, { error: "INVALID_IMAGE" });
  }
  if (!(file instanceof File)) return json(400, { error: "INVALID_IMAGE" });
  if (file.size > MAX_UPLOAD_BYTES) return json(413, { error: "TOO_LARGE" });

  const image = await processImage(Buffer.from(await file.arrayBuffer()));
  if ("error" in image) return json(image.error === "TOO_LARGE" ? 413 : 415, { error: image.error });

  await putObject(image.key, image.data, image.mimeType);
  await prisma.media.create({
    data: {
      key: image.key,
      mimeType: image.mimeType,
      width: image.width,
      height: image.height,
      bytes: image.bytes,
      uploaderId: session.user.id,
    },
  });

  return json(201, { key: image.key, url: mediaUrl(image.key), width: image.width, height: image.height });
}
