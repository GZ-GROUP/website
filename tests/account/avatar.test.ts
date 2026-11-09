import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { isOnCooldown } from "@/lib/account/avatar";
import { avatarKeyFromUrl, isMediaSrc, isServedMediaPath } from "@/lib/editor/links";
import { AVATAR_SIZE, processAvatar, type ProcessedImage } from "@/lib/storage/images";

const UUID = "123e4567-e89b-42d3-a456-426614174000";
const avatarPath = `/media/avatars/${UUID}.webp`;

const png = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: "#12d0ed" } }).png().toBuffer();

describe("processAvatar", () => {
  it("produces a square WebP under avatars/", async () => {
    const result = (await processAvatar(await png(1200, 400))) as ProcessedImage;
    expect(result.key).toMatch(/^avatars\/[0-9a-f-]{36}\.webp$/);
    const meta = await sharp(result.data).metadata();
    expect([meta.format, meta.width, meta.height]).toEqual(["webp", AVATAR_SIZE, AVATAR_SIZE]);
  });

  it("drops location and camera metadata", async () => {
    const withExif = await sharp(await png(800, 800))
      .jpeg()
      .withExif({ IFD3: { GPSLatitude: "10/1 0/1 0/1" }, IFD0: { Make: "Camera" } })
      .toBuffer();
    expect((await sharp(withExif).metadata()).exif).toBeDefined();
    const result = (await processAvatar(withExif)) as ProcessedImage;
    expect((await sharp(result.data).metadata()).exif).toBeUndefined();
  });

  it("rejects what is not an accepted image, whatever it claims to be", async () => {
    expect(await processAvatar(Buffer.from("<svg onload=alert(1)>"))).toEqual({ error: "INVALID_IMAGE" });
    const gif = await sharp(await png(10, 10)).gif().toBuffer();
    expect(await processAvatar(gif)).toEqual({ error: "UNSUPPORTED_TYPE" });
  });
});

describe("avatar paths", () => {
  it("serves avatars and recognises our own", () => {
    expect(isServedMediaPath(avatarPath)).toBe(true);
    expect(avatarKeyFromUrl(avatarPath)).toBe(`avatars/${UUID}.webp`);
  });

  it("treats outside photos as not ours", () => {
    expect(avatarKeyFromUrl("https://avatars.githubusercontent.com/u/1")).toBeNull();
    expect(avatarKeyFromUrl(null)).toBeNull();
    expect(isServedMediaPath("/media/avatars/../secret.webp")).toBe(false);
  });

  it("never lets an avatar be embedded in an article", () => {
    expect(isMediaSrc(avatarPath)).toBe(false);
  });
});

describe("isOnCooldown", () => {
  const now = Date.UTC(2026, 10, 9);

  it("blocks changes within 5 seconds only", () => {
    expect(isOnCooldown(null, now)).toBe(false);
    expect(isOnCooldown(new Date(now - 1_000), now)).toBe(true);
    expect(isOnCooldown(new Date(now - 5_000), now)).toBe(false);
  });
});
