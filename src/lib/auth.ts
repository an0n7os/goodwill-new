import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";

// Customer accounts: email + password, and Google when GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are set.
// Admin sign-in is separate (src/lib/adminSession.ts) and never goes through Better Auth.

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
export const isGoogleAuthEnabled = Boolean(googleClientId && googleClientSecret);

const secret = process.env.BETTER_AUTH_SECRET || process.env.ADMIN_SESSION_SECRET;
if (!secret && process.env.NODE_ENV === "production") {
  throw new Error("BETTER_AUTH_SECRET (or ADMIN_SESSION_SECRET) must be set in production.");
}

export function normalisePhone(raw: string | null | undefined) {
  return (raw || "").replace(/\D/g, "").slice(-10);
}

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "sqlite" }),
  secret: secret || "dev-only-better-auth-secret-change-me",
  // Netlify sets URL to the site's primary address
  baseURL: process.env.BETTER_AUTH_URL || process.env.URL,
  trustedOrigins: process.env.NODE_ENV === "production" ? [] : ["http://localhost:*", "http://127.0.0.1:*"],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  socialProviders: isGoogleAuthEnabled
    ? { google: { clientId: googleClientId!, clientSecret: googleClientSecret!, prompt: "select_account" } }
    : {},
  account: {
    // A Google sign-in with the same verified email joins the existing password account
    accountLinking: { enabled: true, trustedProviders: ["google"] },
  },
  user: {
    additionalFields: {
      phone: { type: "string", required: false, input: true },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const phone = normalisePhone((user as { phone?: string }).phone);
          return { data: { ...user, phone: phone.length === 10 ? phone : null } };
        },
        after: async (user) => {
          await syncCrmCustomer(user as { name: string; email: string; phone?: string | null });
        },
      },
    },
  },
  plugins: [nextCookies()],
});

// Keep the shop's CRM customer record in step with the account (orders are linked by phone)
export async function syncCrmCustomer(user: { name: string; email: string; phone?: string | null }) {
  if (!user.phone) return;
  try {
    const crm = await db.customer.findUnique({ where: { phone: user.phone } });
    if (!crm) await db.customer.create({ data: { name: user.name, phone: user.phone, email: user.email, tier: "retail" } });
    else if (!crm.email) await db.customer.update({ where: { id: crm.id }, data: { email: user.email } });
  } catch (error) {
    console.error("CRM customer sync failed:", error);
  }
}
