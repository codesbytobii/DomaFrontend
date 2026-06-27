import { redirect } from "next/navigation";

/**
 * Root entry. Unauthenticated users belong on /login; once signed in, the login
 * flow routes them to their tenant dashboard (or /platform for Super Admins).
 */
export default function Home() {
  redirect("/login");
}
