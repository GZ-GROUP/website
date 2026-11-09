import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { avatarIsOnCooldown, removeAvatar, replaceAvatar } from "@/lib/account/avatar";
import { processAvatar } from "@/lib/storage/images";
import { readUploadedFile } from "@/lib/storage/upload-request";

const json = (status: number, body: object) => Response.json(body, { status });

async function signedInUser(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  return session && !session.user.mustChangePassword ? session.user : null;
}

/** The photo also appears on static pages (landing, /team). */
const refreshPublicPages = () => revalidatePath("/", "layout");

/** Sets the signed-in user's own photo. No id is accepted: nobody can change someone else's. */
export async function POST(request: Request) {
  const user = await signedInUser(request);
  if (!user) return json(401, { error: "UNAUTHORIZED" });
  if (await avatarIsOnCooldown(user.id)) return json(429, { error: "RATE_LIMITED" });

  const file = await readUploadedFile(request);
  if ("status" in file) return json(file.status, { error: file.error });

  const image = await processAvatar(file.buffer);
  if ("error" in image) return json(image.error === "TOO_LARGE" ? 413 : 415, { error: image.error });

  const url = await replaceAvatar(user.id, image);
  refreshPublicPages();
  return json(201, { url });
}

export async function DELETE(request: Request) {
  const user = await signedInUser(request);
  if (!user) return json(401, { error: "UNAUTHORIZED" });
  if (await avatarIsOnCooldown(user.id)) return json(429, { error: "RATE_LIMITED" });

  await removeAvatar(user.id);
  refreshPublicPages();
  return new Response(null, { status: 204 });
}
