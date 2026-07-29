"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Mail, Lock, ArrowRight, GraduationCap } from "lucide-react";
import { login } from "@/lib/auth";
import { getErrorMessage } from "@/lib/utils";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";

const DEMO = [{ label: "Super Admin", email: "admin@sembly.com", password: "sembly2025" }];

/**
 * /login — platform (super_admin) login ONLY now. Every tenant role
 * (school_admin, teacher, parent, student, accountant) logs in through their
 * own school's /{slug}/login instead — the backend rejects a tenant
 * account's credentials here (no school_slug is sent from this page).
 */
export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await login(form);
      toast.success("Welcome back!");
      router.push(user?.role === "super_admin" ? "/platform" : "/login");
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
        {/* decorative gradient mesh + grain */}
        <div className="pointer-events-none absolute inset-0 opacity-60"
             style={{ background: "radial-gradient(60% 50% at 20% 10%, rgba(232,160,32,0.18), transparent), radial-gradient(50% 50% at 90% 90%, rgba(63,138,96,0.5), transparent)" }} />
        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold-400 font-display text-2xl font-bold text-forest-800">S</span>
          <span className="font-display text-2xl">Sembly</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="font-display text-4xl leading-tight">
            The whole school, in one calm place.
          </h1>
          <p className="mt-4 text-forest-100/80">
            Results, fees, attendance and parent communication — replacing paper,
            WhatsApp and Excel for Nigerian private schools.
          </p>
          <div className="mt-8 flex items-center gap-3 text-sm text-forest-100/70">
            <GraduationCap size={18} className="text-gold-300" />
            Trusted by forward-thinking schools across Lagos.
          </div>
        </div>

        <p className="relative text-xs text-forest-100/50">© {new Date().getFullYear()} Sembly · Built for Nigerian schools</p>
      </div>

      {/* Right — form */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm animate-fade-up">
          {/* mobile brand */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-forest-500 font-display text-xl font-bold text-white">S</span>
            <span className="font-display text-2xl text-ink">Sembly</span>
          </div>

          <h2 className="font-display text-3xl text-ink">Platform sign in</h2>
          <p className="mt-1.5 text-sm text-ink/55">
            For the Sembly platform team. Looking for your school? Use the login link your school
            administrator shared with you.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <Input
              label="Email address"
              name="email"
              type="email"
              icon={Mail}
              placeholder="you@school.edu.ng"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-ink/60">
                <input type="checkbox" className="rounded border-line text-forest-500 focus:ring-forest-300" />
                Remember me
              </label>
              <Link href="/forgot-password" className="font-medium text-forest-600 hover:underline">Forgot password?</Link>
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
              {!loading && <ArrowRight size={18} />}
            </Button>
          </form>

          {/* Demo credentials — remove once real auth is live */}
          <div className="mt-8 rounded-xl border border-dashed border-line bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Demo logins</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  onClick={() => setForm({ email: d.email, password: d.password })}
                  className="rounded-lg border border-line px-2.5 py-2 text-left text-xs text-ink/70 hover:border-forest-300 hover:bg-forest-50"
                >
                  <span className="block font-medium text-ink/80">{d.label}</span>
                  <span className="block truncate text-ink/45">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}