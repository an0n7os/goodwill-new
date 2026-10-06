"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "./auth";

// Same-origin client for the Better Auth routes at /api/auth/*
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});
