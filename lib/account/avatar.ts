import { prisma } from "@/lib/db";
import { avatarKeyFromUrl, mediaUrl } from "@/lib/editor/links";
import type { ProcessedImage } from "@/lib/storage/images";
import { deleteObject, putObject } from "@/lib/storage/s3";

// Every profile-photo change goes through here (ADR 0008).

const COOLDOWN_MS = 5_000;

/** Decoding images is the expensive part, and any account can do it: limit how often. */
export function isOnCooldown(lastChange: Date | null, now: number): boolean {
  return lastChange !== null && now - lastChange.getTime() < COOLDOWN_MS;
}

export async function avatarIsOnCooldown(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { avatarUpdatedAt: true } });
  return isOnCooldown(user?.avatarUpdatedAt ?? null, Date.now());
}

const currentKey = async (userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { image: true } });
  return avatarKeyFromUrl(user.image);
};

/** A leftover file costs storage only; it must never fail a change already saved. */
const discardFile = (key: string | null) => (key ? deleteObject(key).catch(() => undefined) : undefined);

export async function replaceAvatar(userId: string, image: ProcessedImage): Promise<string> {
  const previous = await currentKey(userId);
  await putObject(image.key, image.data, image.mimeType);

  const url = mediaUrl(image.key);
  await prisma.$transaction([
    prisma.media.create({
      data: {
        key: image.key,
        mimeType: image.mimeType,
        width: image.width,
        height: image.height,
        bytes: image.bytes,
        uploaderId: userId,
      },
    }),
    prisma.user.update({ where: { id: userId }, data: { image: url, avatarUpdatedAt: new Date() } }),
    ...(previous ? [prisma.media.deleteMany({ where: { key: previous, uploaderId: userId } })] : []),
  ]);
  await discardFile(previous);
  return url;
}

export async function removeAvatar(userId: string): Promise<void> {
  const previous = await currentKey(userId);
  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { image: null, avatarUpdatedAt: new Date() } }),
    ...(previous ? [prisma.media.deleteMany({ where: { key: previous, uploaderId: userId } })] : []),
  ]);
  await discardFile(previous);
}
