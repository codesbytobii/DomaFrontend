import { redirect } from "next/navigation";

/**
 * /<tenant> -> /<tenant>/dashboard. In Next 15 route params are async, so we
 * await them before redirecting.
 */
export default async function TenantIndex({ params }) {
  const { tenant } = await params;
  redirect(`/${tenant}/dashboard`);
}
