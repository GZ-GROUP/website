import { describe, expect, it } from "vitest";
import { admin, isRoleName, reader, writer } from "@/lib/auth/permissions";

describe("RBAC matrix", () => {
  it("readers can only edit their own profile", () => {
    expect(reader.authorize({ profile: ["update-own"] }).success).toBe(true);
    expect(reader.authorize({ article: ["create"] }).success).toBe(false);
    expect(reader.authorize({ user: ["set-role"] }).success).toBe(false);
  });

  it("writers can author articles but not manage users", () => {
    expect(writer.authorize({ article: ["create", "publish-own"] }).success).toBe(true);
    expect(writer.authorize({ user: ["list"] }).success).toBe(false);
    expect(writer.authorize({ user: ["set-role"] }).success).toBe(false);
  });

  it("admins can list users and change roles, but not impersonate or delete them", () => {
    expect(admin.authorize({ user: ["list", "set-role"] }).success).toBe(true);
    expect(admin.authorize({ user: ["impersonate"] }).success).toBe(false);
    expect(admin.authorize({ user: ["delete"] }).success).toBe(false);
  });

  it("only knows the three product roles", () => {
    expect(isRoleName("reader")).toBe(true);
    expect(isRoleName("writer")).toBe(true);
    expect(isRoleName("admin")).toBe(true);
    expect(isRoleName("user")).toBe(false);
    expect(isRoleName("superadmin")).toBe(false);
  });
});
