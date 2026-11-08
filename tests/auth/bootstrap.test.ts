import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  user: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));
const createUser = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({ prisma: db }));
vi.mock("@/lib/auth", () => ({ auth: { api: { createUser } } }));

const { ensureMasterAdmin } = await import("@/lib/auth/bootstrap");

const PASSWORD = "a-very-long-initial-password";
const env = { ADMIN_EMAIL: "Admin@GZGroup.dev", ADMIN_INITIAL_PASSWORD: PASSWORD } as unknown as NodeJS.ProcessEnv;

describe("ensureMasterAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("does nothing when a master admin already exists", async () => {
    db.user.findFirst.mockResolvedValue({ id: "existing" });
    await expect(ensureMasterAdmin(env)).resolves.toBe("exists");
    expect(createUser).not.toHaveBeenCalled();
  });

  it("refuses a missing or short initial password", async () => {
    db.user.findFirst.mockResolvedValue(null);
    const weak = { ...env, ADMIN_INITIAL_PASSWORD: "short" } as NodeJS.ProcessEnv;
    await expect(ensureMasterAdmin(weak)).resolves.toBe("skipped");
    expect(createUser).not.toHaveBeenCalled();
  });

  it("creates the admin once, flags it, and never logs the password", async () => {
    db.user.findFirst.mockResolvedValue(null);
    db.user.findUnique.mockResolvedValue(null);
    createUser.mockResolvedValue({ user: { id: "u1" } });

    await expect(ensureMasterAdmin(env)).resolves.toBe("created");

    expect(createUser).toHaveBeenCalledWith({
      body: { email: "admin@gzgroup.dev", password: PASSWORD, name: "GZ Group", role: "admin" },
    });
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: expect.objectContaining({ isSuperAdmin: true, mustChangePassword: true, emailVerified: true }),
    });
    const logged = [console.info, console.warn, console.error].flatMap((fn) => vi.mocked(fn).mock.calls.flat());
    expect(logged.join(" ")).not.toContain(PASSWORD);
  });

  it("does not hijack an existing regular account with the admin email", async () => {
    db.user.findFirst.mockResolvedValue(null);
    db.user.findUnique.mockResolvedValue({ id: "regular" });
    await expect(ensureMasterAdmin(env)).resolves.toBe("skipped");
    expect(createUser).not.toHaveBeenCalled();
  });
});
