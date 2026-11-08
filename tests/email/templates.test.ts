import { describe, expect, it } from "vitest";
import { passwordResetEmail, resolveEmailLocale, verifyEmailEmail } from "@/lib/email/templates";

const url = "https://gzgroup.dev/api/auth/reset-password/abc?callbackURL=%2Freset-password";

describe("email templates", () => {
  it("renders the password reset email in Spanish and English", () => {
    const es = passwordResetEmail({ to: "ana@example.test", name: "Ana", url, locale: "es" });
    const en = passwordResetEmail({ to: "ana@example.test", name: "Ana", url, locale: "en" });
    expect(es.subject).toBe("Restablece tu contraseña de GZ Group");
    expect(en.subject).toBe("Reset your GZ Group password");
    expect(es.text).toContain(url);
    expect(es.html).toContain('lang="es"');
  });

  it("escapes user-controlled names in HTML", () => {
    const mail = verifyEmailEmail({ to: "x@example.test", name: "<script>alert(1)</script>", url, locale: "es" });
    expect(mail.html).not.toContain("<script>");
  });

  it("picks the locale from the NEXT_LOCALE cookie, then the referer, then Spanish", () => {
    const cookie = new Request("https://gzgroup.dev/api", { headers: { cookie: "a=1; NEXT_LOCALE=en" } });
    const referer = new Request("https://gzgroup.dev/api", { headers: { referer: "https://gzgroup.dev/en/login" } });
    expect(resolveEmailLocale(cookie)).toBe("en");
    expect(resolveEmailLocale(referer)).toBe("en");
    expect(resolveEmailLocale(new Request("https://gzgroup.dev/api"))).toBe("es");
    expect(resolveEmailLocale()).toBe("es");
  });
});
