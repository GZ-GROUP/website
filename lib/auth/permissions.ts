import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";

// Single source of truth for RBAC, shared by the server config and the client.
// Every check is enforced on the server; the client only uses it to hide UI.

export const statements = {
  ...defaultStatements,
  profile: ["update-own"],
  article: ["create", "update-own", "publish-own", "delete-own"],
  comment: ["create", "delete-own", "delete-any"],
  reaction: ["set-own"],
} as const;

export const ac = createAccessControl(statements);

/** Default for every public sign-up: comments, likes and their own profile. */
export const reader = ac.newRole({
  profile: ["update-own"],
  comment: ["create", "delete-own"],
  reaction: ["set-own"],
});

/** Granted only by the master admin, never through sign-up. */
export const writer = ac.newRole({
  profile: ["update-own"],
  article: ["create", "update-own", "publish-own", "delete-own"],
  comment: ["create", "delete-own"],
  reaction: ["set-own"],
});

export const admin = ac.newRole({
  profile: ["update-own"],
  article: ["create", "update-own", "publish-own", "delete-own"],
  comment: ["create", "delete-own", "delete-any"],
  reaction: ["set-own"],
  user: ["create", "list", "set-role", "ban", "get", "update"],
  session: ["list", "revoke"],
});

export const roles = { reader, writer, admin } as const;

export type RoleName = keyof typeof roles;
export const ROLE_NAMES = Object.keys(roles) as RoleName[];

export function isRoleName(value: unknown): value is RoleName {
  return typeof value === "string" && (ROLE_NAMES as string[]).includes(value);
}
