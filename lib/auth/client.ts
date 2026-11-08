"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields, usernameClient } from "better-auth/client/plugins";
import { ac, roles } from "@/lib/auth/permissions";
import type { auth } from "@/lib/auth";

// Same-origin client: requests go to /api/auth on the current host.
export const authClient = createAuthClient({
  plugins: [usernameClient(), adminClient({ ac, roles }), inferAdditionalFields<typeof auth>()],
});
