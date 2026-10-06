import { redirect } from "next/navigation";

// /admin opens the dashboard (src/proxy.ts sends signed-out visitors to the login page first)
export default function AdminIndex() {
  redirect("/admin/dashboard");
}
