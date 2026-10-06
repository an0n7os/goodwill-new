import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminToken } from "./adminSession";
import { db } from "./db";

// Server actions are public endpoints: every admin action must call this first.
// Also re-checks the account, so a disabled admin is locked out before their cookie expires.
export async function requireAdmin() {
  const session = verifyAdminToken((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!session) throw new Error("Unauthorized: admin session required.");
  const user = await db.adminUser.findUnique({ where: { id: session.id }, select: { isActive: true, role: true } });
  if (!user?.isActive) throw new Error("Unauthorized: this admin account is disabled.");
  return { ...session, role: user.role };
}

export async function requireOwner() {
  const session = await requireAdmin();
  if (session.role !== "owner") throw new Error("Only the shop owner can do this.");
  return session;
}
