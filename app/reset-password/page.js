"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Lock, ArrowRight, ArrowLeft, AlertCircle } from "lucide-react";
import api from "@/lib/axios";
import { getErrorMessage } from "@/lib/utils";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";

/**
 * /reset-password?token=xxx&email=yyy
 *
 * Public page — no token needed.
 * Laravel's reset link puts `token` and `email` as query params.
 * We read them and POST to /auth/reset-password.
 *
 * Wrapped in Suspense because useSearchParams() requires it in Next.js 15.
 */
function ResetPasswordForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [form,    setForm]    = useState({ password: "", password_confirmation: "" });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  // If there's no token in the URL at all, the link is invalid
  const invalidLink = !token || !email;

  const validate = () => {
    const e = {};
    if (form.password.length < 8)
      e.password = "Password must be at least 8 characters.";
    if (form.password !== form.password_confirmation)
      e.password_confirmation = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token,
        email,
        password:              form.password,
        password_confirmation: form.password_confirmation,
      });

      setDone(true);
      toast.success("Password reset! You can now sign in.");

      // Short delay so the user sees the success state, then redirect to login
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      const serverErrors = err?.response?.data?.errors;
      if (serverErrors) {
        setErrors(serverErrors);
      } else {
        toast.error(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Invalid link state ──────────────────────────────────────────────────────
  if (invalidLink) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-500">
          <AlertCircle size={32} />
        </div>
        <h2 className="font-display text-3xl text-ink">Invalid reset link</h2>
        <p className="mt-3 text-sm text-ink/55">
          This password reset link is missing required information. Please
          request a new one — reset links are only valid for 60 minutes and
          can only be used once.
        </p>
        <a
          href="/forgot-password"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-forest-600 px-6 py-3 text-sm font-semibold text-white hover:bg-forest-700"
        >
          Request a new link
          <ArrowRight size={16} />
        </a>
        <div className="mt-4">
          <a
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink/50 hover:text-ink/80"
          >
            <ArrowLeft size={15} />
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  // ── Success state ───────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-forest-50 text-forest-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-8 w-8">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="font-display text-3xl text-ink">Password reset!</h2>
        <p className="mt-3 text-sm text-ink/55">
          Your password has been updated. Redirecting you to sign in…
        </p>
        <a
          href="/login"
          className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-forest-600 hover:underline"
        >
          Go to sign in
          <ArrowRight size={15} />
        </a>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="mb-6 grid h-12 w-12 place-items-center rounded-xl bg-forest-50 text-forest-600">
        <Lock size={24} />
      </div>

      <h2 className="font-display text-3xl text-ink">Reset your password</h2>
      <p className="mt-1.5 text-sm text-ink/55">
        Resetting password for{" "}
        <span className="font-medium text-ink/80">{email}</span>. Choose
        something you'll remember.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Input
          label="New password"
          name="password"
          type="password"
          icon={Lock}
          placeholder="Min. 8 characters"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          error={
            Array.isArray(errors.password)
              ? errors.password[0]
              : errors.password
          }
          required
        />
        <Input
          label="Confirm new password"
          name="password_confirmation"
          type="password"
          icon={Lock}
          placeholder="Repeat your password"
          value={form.password_confirmation}
          onChange={(e) =>
            setForm({ ...form, password_confirmation: e.target.value })
          }
          error={
            Array.isArray(errors.password_confirmation)
              ? errors.password_confirmation[0]
              : errors.password_confirmation
          }
          required
        />

        {/* Token error — shown when the link has expired or been used */}
        {(errors.token || errors.email) && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>
              {Array.isArray(errors.token)
                ? errors.token[0]
                : errors.token || errors.email}{" "}
              <a href="/forgot-password" className="font-semibold underline">
                Request a new link.
              </a>
            </span>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={loading}
        >
          {loading ? "Resetting…" : "Reset password"}
          {!loading && <ArrowRight size={18} />}
        </Button>
      </form>

      <a
        href="/login"
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-ink/50 hover:text-ink/80"
      >
        <ArrowLeft size={15} />
        Back to sign in
      </a>
    </>
  );
}

// Wrap in Suspense — required by Next.js 15 for useSearchParams()
export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen">
      {/* Left — brand panel */}
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
          <span className="font-display text-2xl">Sembly</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="font-display text-4xl leading-tight">
            Set a new password and get back in.
          </h1>
          <p className="mt-4 text-forest-100/80">
            Choose something secure that you haven't used before. This reset
            link expires in 60 minutes.
          </p>
        </div>

        <p className="relative text-xs text-forest-100/50">
          © {new Date().getFullYear()} Sembly · Built for Nigerian schools
        </p>
      </div>

      {/* Right — form */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm animate-fade-up">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-forest-500 font-display text-xl font-bold text-white">
              S
            </span>
            <span className="font-display text-2xl text-ink">Sembly</span>
          </div>

          <Suspense
            fallback={
              <div className="animate-pulse space-y-4">
                <div className="h-10 w-10 rounded-xl bg-forest-50" />
                <div className="h-8 w-48 rounded bg-ink/10" />
                <div className="h-4 w-64 rounded bg-ink/5" />
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}