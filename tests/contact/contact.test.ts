import { describe, expect, it } from "vitest";
import { CONTACT_LIMITS } from "@/lib/contact/limits";
import { contactSchema } from "@/lib/contact/validation";
import { contactMessageEmail } from "@/lib/email/templates";
import { clientIp } from "@/lib/security/client-ip";

const valid = {
  name: "Ana Pérez",
  email: "ana@example.test",
  phone: "",
  organization: "",
  reason: "general",
  subject: "Una consulta",
  message: "Hola, quería preguntar algo sobre el proyecto.",
  consent: "on",
};

const errorsOf = (input: Record<string, unknown>) => {
  const result = contactSchema.safeParse(input);
  return result.success ? {} : Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]));
};

describe("contactSchema", () => {
  it("accepts a complete message and turns empty optionals into null", () => {
    const parsed = contactSchema.parse(valid);
    expect(parsed.phone).toBeNull();
    expect(parsed.organization).toBeNull();
  });

  it("names what is missing", () => {
    expect(errorsOf({ ...valid, name: "  ", subject: "" })).toEqual({ name: "REQUIRED", subject: "REQUIRED" });
    expect(errorsOf({ ...valid, reason: "nope" })).toEqual({ reason: "REQUIRED" });
  });

  it("requires the consent box", () => {
    expect(errorsOf({ ...valid, consent: undefined })).toEqual({ consent: "CONSENT_REQUIRED" });
  });

  it("rejects bad formats and lengths", () => {
    expect(errorsOf({ ...valid, email: "nope" })).toEqual({ email: "INVALID_EMAIL" });
    expect(errorsOf({ ...valid, phone: "abc" })).toEqual({ phone: "INVALID_PHONE" });
    expect(errorsOf({ ...valid, message: "corto" })).toEqual({ message: "MESSAGE_TOO_SHORT" });
    expect(errorsOf({ ...valid, message: "a".repeat(CONTACT_LIMITS.message + 1) })).toEqual({ message: "TOO_LONG" });
  });

  it("refuses line breaks that could reach email headers", () => {
    expect(errorsOf({ ...valid, subject: "Hola\r\nBcc: victim@example.test" })).toEqual({ subject: "INVALID_TEXT" });
    expect(errorsOf({ ...valid, name: "Ana\nBcc: x" })).toEqual({ name: "INVALID_TEXT" });
  });

  it("keeps line breaks in the message itself", () => {
    expect(contactSchema.parse({ ...valid, message: "Primera línea\nSegunda línea" }).message).toContain("\n");
  });
});

describe("clientIp", () => {
  it("trusts only the last forwarded address, the one our proxy added", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2, 9.9.9.9" }))).toBe("9.9.9.9");
  });

  it("falls back when the header is missing", () => {
    expect(clientIp(new Headers({ "x-real-ip": "8.8.8.8" }))).toBe("8.8.8.8");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});

describe("contactMessageEmail", () => {
  const input = {
    to: "admin@example.test",
    name: "Ana <b>Pérez</b>",
    email: "ana@example.test",
    phone: null,
    organization: "ACME",
    reason: "privacy" as const,
    subject: "Sobre <script>",
    message: "Línea 1\nLínea 2 <img src=x onerror=alert(1)>",
  };

  it("goes to the master admin, and replies go to whoever wrote", () => {
    const mail = contactMessageEmail(input);
    expect(mail.to).toBe("admin@example.test");
    expect(mail.replyTo).toBe("ana@example.test");
    expect(mail.subject).toBe("Contacto web: Sobre <script>");
  });

  it("escapes everything the visitor typed in the HTML version", () => {
    const { html } = contactMessageEmail(input);
    expect(html).not.toContain("<b>Pérez");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img src=x");
  });

  it("includes the fields that were filled in, and only those", () => {
    const { text } = contactMessageEmail(input);
    expect(text).toContain("Organización: ACME");
    expect(text).toContain("Motivo: Privacidad y datos");
    expect(text).not.toContain("Teléfono");
    expect(text).toContain("Línea 1\nLínea 2");
  });
});
