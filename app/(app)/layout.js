import AppShell from "@/components/layout/AppShell";

/**
 * Layout for the (app) route group — every authenticated page renders inside
 * the persistent shell (sidebar + topbar). The route group keeps /login out
 * of the shell while giving all app pages the frame for free.
 */
export default function AppLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}
