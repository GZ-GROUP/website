import { describe, expect, it } from "vitest";
import { changePasswordSchema, profileSchema } from "@/lib/validation/profile";

const valid = { name: "Ana", username: "Ana_Perez", bio: "", description: "  ", occupation: "" };

describe("profileSchema", () => {
  it("normalizes the username and turns blanks into null", () => {
    const result = profileSchema.parse(valid);
    expect(result).toEqual({ name: "Ana", username: "ana_perez", bio: null, description: null, occupation: null });
  });

  it("accepts known occupations only", () => {
    expect(profileSchema.parse({ ...valid, occupation: "STUDENT" }).occupation).toBe("STUDENT");
    expect(profileSchema.safeParse({ ...valid, occupation: "ASTRONAUT" }).success).toBe(false);
  });

  it("reports translated error keys", () => {
    const result = profileSchema.safeParse({ ...valid, name: " ", username: "admin", bio: "x".repeat(281) });
    expect(result.success).toBe(false);
    const messages = Object.fromEntries(result.error!.issues.map((i) => [String(i.path[0]), i.message]));
    expect(messages).toMatchObject({ name: "FIELD_REQUIRED", username: "INVALID_USERNAME", bio: "FIELD_TOO_LONG" });
  });
});

describe("changePasswordSchema", () => {
  it("requires matching passwords of at least 10 characters", () => {
    expect(
      changePasswordSchema.safeParse({ currentPassword: "old", newPassword: "short", confirmPassword: "short" }).success,
    ).toBe(false);
    const mismatch = changePasswordSchema.safeParse({
      currentPassword: "old",
      newPassword: "long-enough-1",
      confirmPassword: "long-enough-2",
    });
    expect(mismatch.error?.issues[0].message).toBe("PASSWORDS_DO_NOT_MATCH");
  });
});
