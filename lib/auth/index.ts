import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin as adminPlugin, username } from "better-auth/plugins";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail, resolveEmailLocale, verifyEmailEmail } from "@/lib/email/templates";
import { ac, roles } from "@/lib/auth/permissions";
import { isValidUsername, toUsernameCandidate, USERNAME_MAX, USERNAME_MIN } from "@/lib/auth/usernames";

// Server-only. Read env with process.env here (not serverEnv()) so that
// `next build` can import this module without runtime secrets.
const env = process.env;
const masterAdminEmail = (env.ADMIN_EMAIL || "admin@gzgroup.dev").toLowerCase();

/** OAuth providers are enabled only when their credentials exist. */
function socialProviders() {
  const providers: Parameters<typeof betterAuth>[0]["socialProviders"] = {};
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    providers.github = {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      mapProfileToUser: (profile) => ({
        username: toUsernameCandidate(profile.login),
        displayUsername: profile.login,
      }),
    };
  }
  // Ready, but inactive until the LinkedIn app ("Sign In with LinkedIn using OpenID Connect") exists.
  if (env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET) {
    providers.linkedin = { clientId: env.LINKEDIN_CLIENT_ID, clientSecret: env.LINKEDIN_CLIENT_SECRET };
  }
  return providers;
}

/** Providers whose linked account counts as an identity verification badge. */
const IDENTITY_PROVIDERS = { github: "GITHUB", linkedin: "LINKEDIN" } as const;

async function uniqueUsername(candidate: string): Promise<string> {
  let username = candidate;
  while (await prisma.user.findUnique({ where: { username }, select: { id: true } })) {
    const suffix = Math.random().toString(36).slice(2, 6);
    username = `${candidate.slice(0, USERNAME_MAX - 5)}_${suffix}`;
  }
  return username;
}

export const auth = betterAuth({
  appName: "GZ Group",
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
    requireEmailVerification: false, // product decision: verification is optional
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }, request) => {
      await sendEmail(
        passwordResetEmail({ to: user.email, name: user.name, url, locale: resolveEmailLocale(request) }),
      );
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }, request) => {
      await sendEmail(verifyEmailEmail({ to: user.email, name: user.name, url, locale: resolveEmailLocale(request) }));
    },
  },

  socialProviders: socialProviders(),

  account: {
    accountLinking: {
      enabled: true,
      // Linking happens only when a signed-in user asks for it (Account page).
      // A matching email alone never attaches a provider to an existing account.
      disableImplicitLinking: true,
      // A GitHub/LinkedIn email often differs from the sign-up email.
      allowDifferentEmails: true,
    },
  },

  user: {
    additionalFields: {
      isSuperAdmin: { type: "boolean", required: false, defaultValue: false, input: false },
      mustChangePassword: { type: "boolean", required: false, defaultValue: false, input: false },
    },
    // The master admin address can only be provisioned by the bootstrap (admin method).
    validateUserInfo: ({ user, source }) => {
      if (source.method === "admin") return;
      if (typeof user.email === "string" && user.email.toLowerCase() === masterAdminEmail) {
        return { error: "email_not_allowed" };
      }
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh daily
  },

  rateLimit: {
    // On by default in production; AUTH_RATE_LIMIT=off only for the e2e suite.
    enabled: env.AUTH_RATE_LIMIT !== "off" && env.NODE_ENV === "production",
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-in/username": { window: 60, max: 5 },
      "/sign-up/email": { window: 60, max: 3 },
      "/request-password-reset": { window: 300, max: 3 },
    },
  },

  databaseHooks: {
    user: {
      update: {
        // The public update endpoint would accept any URL as a photo (a tracking
        // pixel, for one). Photos only change through /api/account/avatar.
        before: async (user, context) => {
          if (context?.path === "/update-user" && "image" in user) {
            // Better Auth merges this over the original, so the key must be overwritten.
            return { data: { image: undefined } };
          }
        },
      },
      create: {
        before: async (user) => {
          // OAuth sign-ups get a username from the provider handle; keep it unique.
          if (typeof user.username === "string") {
            return { data: { ...user, username: await uniqueUsername(user.username) } };
          }
        },
      },
    },
    account: {
      create: {
        after: async (account) => {
          const provider = IDENTITY_PROVIDERS[account.providerId as keyof typeof IDENTITY_PROVIDERS];
          if (!provider) return;
          await prisma.identityVerification.upsert({
            where: { userId_provider: { userId: account.userId, provider } },
            create: { userId: account.userId, provider },
            update: { verifiedAt: new Date() },
          });
        },
      },
      delete: {
        after: async (account) => {
          const provider = IDENTITY_PROVIDERS[account.providerId as keyof typeof IDENTITY_PROVIDERS];
          if (!provider) return;
          await prisma.identityVerification.deleteMany({ where: { userId: account.userId, provider } });
        },
      },
    },
  },

  plugins: [
    username({
      minUsernameLength: USERNAME_MIN,
      maxUsernameLength: USERNAME_MAX,
      usernameValidator: isValidUsername,
    }),
    adminPlugin({ ac, roles, defaultRole: "reader", adminRoles: ["admin"] }),
    nextCookies(), // must stay last
  ],
});

export type Session = typeof auth.$Infer.Session;
