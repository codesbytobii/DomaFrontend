"use client";

import { useParams } from "next/navigation";
import { useStore } from "./store";

/**
 * Multi-tenancy is path-based: every school's pages live under its slug, e.g.
 *   /greenfield/dashboard, /greenfield/results, /greenfield/fees
 * The slug comes from the URL ([tenant] segment) and falls back to the logged-in
 * school's subdomain. The Super Admin platform console is NOT tenant-scoped
 * (it lives at /platform, a reserved slug).
 *
 * In production the slug also maps to a subdomain (greenfield.sembly.com); the
 * path form keeps everything working on a single domain in development.
 */
export function useTenantSlug() {
  const params = useParams();
  const school = useStore((s) => s.school);
  return params?.tenant || school?.subdomain || "";
}

/** Returns a builder: tenantPath("/results") -> "/greenfield/results". */
export function useTenantPath() {
  const slug = useTenantSlug();
  return (page = "") => (slug ? `/${slug}${page}` : page);
}

/** Non-hook helper for places that already know the slug. */
export function tenantHref(slug, page = "") {
  return slug ? `/${slug}${page}` : page;
}
