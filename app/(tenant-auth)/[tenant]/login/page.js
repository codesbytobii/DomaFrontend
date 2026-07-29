"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Mail, Lock, ArrowRight, GraduationCap } from "lucide-react";
import { login } from "@/lib/auth";
import { getErrorMessage } from "@/lib/utils";
import { usePublicSchool } from "../layout";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";

/**
 * /{tenant}/login — the real login page for every tenant role (school_admin,
 * teacher, parent, student, accountant). The slug is sent to the backend as
 * school_slug and checked against the account's actual school — a correct
 * email+password combo for a DIFFERENT school still fails here.
 */
export default function TenantLoginPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params?.tenant || "";
  const school = usePublicSchool();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ ...form, schoolSlug: slug });
      toast.success("Welcome back!");
      router.push(`/${slug}/dashboard`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — brand panel (hidden on small screens) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-forest-700 p-12 text-forest-50 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(60% 50% at 20% 10%, rgba(232,160,32,0.18), transparent), radial-gradient(50% 50% at 90% 90%, rgba(63,138,96,0.5), transparent)",
          }}
        />
        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-400 font-display text-2xl font-bold text-forest-800">
            S
          </span>
          <span className="font-display text-2xl">{school?.name || "Sembly"}</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="font-display text-4xl leading-tight">
            {school?.motto || "The whole school, in one calm place."}
          </h1>
          <p className="mt-4 text-forest-100/80">
            Results, fees, attendance and parent communication — all in one place.
          </p>
          <div className="mt-8 flex items-center gap-3 text-sm text-forest-100/70">
            <GraduationCap size={18} className="text-gold-300" />
            Powered by Sembly
          </div>
        </div>

        <p className="relative text-xs text-forest-100/50">
          © {new Date().getFullYear()} Sembly · Built for Nigerian schools
        </p>
      </div>

      {/* Right — form */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-forest-500 font-display text-xl font-bold text-white">
              S
            </span>
            <span className="font-display text-2xl text-ink">{school?.name || "Sembly"}</span>
          </div>

          <h2 className="font-display text-3xl text-ink">Sign in</h2>
          <p className="mt-1.5 text-sm text-ink/55">Welcome back to {school?.name}. Enter your details to continue.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Input
              label="Email address"
              name="email"
              type="email"
              icon={Mail}
              placeholder="you@school.edu.ng"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoFocus
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <div className="flex items-center justify-end text-sm">
              <Link href={`/${slug}/forgot-password`} className="font-medium text-forest-600 hover:underline">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
              {!loading && <ArrowRight size={18} />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}