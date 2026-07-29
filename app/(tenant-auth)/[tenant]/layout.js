"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchPublicSchool } from "@/lib/tenant";
import { GraduationCap, SearchX } from "lucide-react";

/**
 * Layout for /{tenant}/login, /{tenant}/forgot-password, /{tenant}/set-password.
 *
 * This is the actual "strict" enforcement for pre-auth pages: before any of
 * the three forms render, the slug is checked against the real schools table
 * via GET /public/schools/{slug}. A mistyped or made-up slug — "/laenre/login"
 * vs the real "/lanre/login" — never reaches a working form; it gets a clear
 * "school not found" state instead.
 *
 * The confirmed school (name/logo) is exposed via context so the child pages
 * can render it without a second fetch.
 */
const SchoolContext = createContext(null);
export function usePublicSchool() {
  return useContext(SchoolContext);
}

export default function TenantAuthLayout({ children }) {
  const params = useParams();
  const slug = params?.tenant || "";
  const [state, setState] = useState({ loading: true, school: null });

  useEffect(() => {
    let active = true;
    setState({ loading: true, school: null });
    fetchPublicSchool(slug).then((school) => {
      if (active) setState({ loading: false, school });
    });
    return () => { active = false; };
  }, [slug]);

  if (state.loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper">
        <div className="flex items-center gap-3 text-ink/50">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-forest-300 border-t-forest-600" />
          Loading…
        </div>
      </div>
    );
  }

  if (!state.school) {
    return (
      <div className="grid min-h-screen place-items-center bg-paper px-6">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-ink/5 text-ink/40">
            <SearchX size={26} />
          </div>
          <h1 className="font-display text-2xl text-ink">School not found</h1>
          <p className="mt-2 text-sm text-ink/55">
            We couldn't find a school at <span className="font-mono">/{slug}</span>. Double-check the
            link your school shared with you, or contact your school administrator.
          </p>
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-ink/40">
            <GraduationCap size={14} /> Sembly
          </div>
        </div>
      </div>
    );
  }

  return <SchoolContext.Provider value={state.school}>{children}</SchoolContext.Provider>;
}