# ADR 0006: Transactional email over SMTP

- **Status:** Accepted
- **Date:** 2026-11-08

## Context

Password reset and the optional email verification need to send email. GZ Group already runs its own mail server, so the app should use it through configuration instead of adding a vendor.

## Decision

- **Transport:** `nodemailer` over plain SMTP. It works with any standards-compliant server, including the self-hosted one. Configuration lives only in the environment: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` (implicit TLS on 465, otherwise STARTTLS), `SMTP_USER`, `SMTP_PASSWORD` and `EMAIL_FROM`.
- **Modes:** `lib/email/index.ts` chooses the transport.

  | Transport | When |
  | --- | --- |
  | `smtp` | `SMTP_HOST` is set. Required in production: the app throws if email is unconfigured there. |
  | `console` | Development without SMTP. The message and its link are printed to the terminal. |
  | `file` | The e2e suite (`EMAIL_TRANSPORT=file`). Messages are written to `.e2e/mailbox/` for Playwright to read. |

- **Templates:** `lib/email/templates.ts` renders HTML and plain-text versions in Spanish or English from the `Email` message namespace.
  - Language: the `NEXT_LOCALE` cookie, then the referer, then Spanish.
  - User names are HTML-escaped.
  - Colours are literal hex values mirroring the brand tokens, because email clients ignore CSS variables. This is the only place outside `globals.css` where that is allowed.
- **Account enumeration:** "Forgot password" always shows the same confirmation, whether or not the account exists.

## Consequences

- Deliverability depends on the mail server's SPF, DKIM and DMARC records for the `EMAIL_FROM` domain. Check them before launch.
- Sending is synchronous within the request. A queue is **[POST-MVP]**, only if volume or latency requires it.
