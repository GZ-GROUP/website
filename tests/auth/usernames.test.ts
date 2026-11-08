import { describe, expect, it } from "vitest";
import { isValidUsername, toUsernameCandidate } from "@/lib/auth/usernames";

describe("usernames", () => {
  it.each(["ana", "ana_perez", "ana.perez", "a1b2c3", "x".repeat(30)])("accepts %s", (value) => {
    expect(isValidUsername(value)).toBe(true);
  });

  it.each(["ab", "x".repeat(31), "_ana", "ana.", "ana perez", "ana-perez", "añá"])("rejects %s", (value) => {
    expect(isValidUsername(value)).toBe(false);
  });

  it.each(["admin", "Admin", "gzgroup", "superadmin", "support", "root"])("reserves %s", (value) => {
    expect(isValidUsername(value)).toBe(false);
  });

  it("turns provider handles into valid candidates", () => {
    expect(toUsernameCandidate("Ian-Lee")).toBe("ian_lee");
    expect(isValidUsername(toUsernameCandidate("admin"))).toBe(true);
    expect(isValidUsername(toUsernameCandidate("--x--"))).toBe(true);
  });
});
