import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));

vi.mock("@/lib/auth", () => ({ auth: { api: { getSession } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("next-intl/server", () => ({ getLocale: async () => "es" }));
vi.mock("@/i18n/navigation", () => ({ redirect: vi.fn() }));

const { requireAdmin } = await import("@/lib/auth/session");

const session = (user: Record<string, unknown>) => ({ session: {}, user: { id: "u1", mustChangePassword: false, ...user } });

describe("requireAdmin", () => {
  beforeEach(() => getSession.mockReset());

  it("admits the master admin", async () => {
    getSession.mockResolvedValue(session({ role: "admin", isSuperAdmin: true }));
    await expect(requireAdmin()).resolves.toMatchObject({ user: { isSuperAdmin: true } });
  });

  it("answers 404 to an admin who is not the master admin", async () => {
    getSession.mockResolvedValue(session({ role: "admin", isSuperAdmin: false }));
    await expect(requireAdmin()).rejects.toThrow("NOT_FOUND");
  });

  it("answers 404 to readers and to visitors", async () => {
    getSession.mockResolvedValue(session({ role: "reader", isSuperAdmin: false }));
    await expect(requireAdmin()).rejects.toThrow("NOT_FOUND");
    getSession.mockResolvedValue(null);
    await expect(requireAdmin()).rejects.toThrow("NOT_FOUND");
  });
});
