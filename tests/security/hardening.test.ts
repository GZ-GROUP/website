import { afterEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.fn();
vi.mock("@/lib/db", () => ({ prisma: { $queryRaw: queryRaw } }));

const { logger, serializeError } = await import("@/lib/logging/logger");
const { LIMITS, withinRateLimit } = await import("@/lib/security/rate-limit");
const { GET } = await import("@/app/api/health/route");

afterEach(() => {
  vi.restoreAllMocks();
  queryRaw.mockReset();
});

describe("logger", () => {
  function captureLine(run: () => void) {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    run();
    return JSON.parse(error.mock.calls[0][0] as string) as Record<string, unknown>;
  }

  it("writes one JSON object with level and event", () => {
    const line = captureLine(() => logger.error("something_failed", { route: "/blog" }));
    expect(line).toMatchObject({ level: "error", event: "something_failed", route: "/blog" });
    expect(typeof line.time).toBe("string");
  });

  it("redacts credentials and personal data at any depth", () => {
    const line = captureLine(() =>
      logger.error("x", {
        email: "ana@example.test",
        request: { headers: { cookie: "session=abc", authorization: "Bearer abc" }, password: "hunter2" },
        resetToken: "abc",
      }),
    );
    const text = JSON.stringify(line);
    for (const leaked of ["ana@example.test", "session=abc", "Bearer abc", "hunter2"]) {
      expect(text).not.toContain(leaked);
    }
  });

  it("removes email addresses quoted inside error messages", () => {
    const line = captureLine(() => logger.error("x", { error: serializeError(new Error("duplicate key ana@example.test")) }));
    expect(JSON.stringify(line)).not.toContain("ana@example.test");
  });

  it("truncates very long text", () => {
    const line = captureLine(() => logger.error("x", { detail: "a".repeat(5000) }));
    expect((line.detail as string).length).toBeLessThan(1100);
  });

  it("keeps the digest that links an error to the reference shown to users", () => {
    const error = Object.assign(new Error("boom"), { digest: "12345" });
    expect(serializeError(error)).toMatchObject({ message: "boom", digest: "12345" });
    expect(serializeError("plain")).toEqual({ message: "plain" });
  });
});

describe("withinRateLimit", () => {
  it("allows up to the limit and refuses the next attempt", async () => {
    queryRaw.mockResolvedValueOnce([{ count: LIMITS.like.max }]);
    expect(await withinRateLimit("like", "u1")).toBe(true);
    queryRaw.mockResolvedValueOnce([{ count: LIMITS.like.max + 1 }]);
    expect(await withinRateLimit("like", "u1")).toBe(false);
  });

  it("keeps its keys apart from Better Auth's, per action and user", async () => {
    queryRaw.mockResolvedValue([{ count: 1 }]);
    await withinRateLimit("upload", "u9");
    expect(queryRaw.mock.calls[0]).toContain("app:upload:u9");
  });
});

describe("GET /api/health", () => {
  it("answers ok when the database responds", async () => {
    queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("answers 503 without details when it does not", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    queryRaw.mockRejectedValue(new Error("connect ECONNREFUSED 10.0.0.5:5432"));
    const response = await GET();
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("10.0.0.5");
  });
});
