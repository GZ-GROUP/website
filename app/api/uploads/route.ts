import { auth } from "@/lib/auth";
import { canUseStudio } from "@/lib/articles/permissions";
import { prisma } from "@/lib/db";
import { mediaUrl } from "@/lib/editor/links";
import { putObject } from "@/lib/storage/s3";
import { processImage } from "@/lib/storage/images";
import { readUploadedFile } from "@/lib/storage/upload-request";
import { withinRateLimit } from "@/lib/security/rate-limit";

const json = (status: number, body: object) => Response.json(body, { status });

/** Image upload for the studio (writers and admins only). */
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  // Same answer as a missing route: the studio's existence is not revealed.
  if (!session || session.user.mustChangePassword || !canUseStudio(session.user)) {
    return json(404, { error: "NOT_FOUND" });
  }

  if (!(await withinRateLimit("upload", session.user.id))) return json(429, { error: "RATE_LIMITED" });

  const file = await readUploadedFile(request);
  if ("status" in file) return json(file.status, { error: file.error });

  const image = await processImage(file.buffer);
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
