"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Mail, ArrowRight, ArrowLeft, GraduationCap, MailCheck } from "lucide-react";
import { requestPasswordReset } from "@/lib/auth";
import { getErrorMessage } from "@/lib/utils";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";

/**
 * /forgot-password
 *
 * Calls POST /auth/forgot-password. The backend always returns the same
 * generic message whether or not the email exists (see
 * PasswordResetController::forgot) — so this page shows one confirmation
 * state either way, rather than branching on "found" vs "not found".
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await requestPasswordReset({ email });
      setSent(true);
    } catch (err) {
      // Only reachable for things like a malformed email — the "not found"
      // case is intentionally indistinguishable from success.
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — brand panel, matches /login and /set-password */}
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
            Locked out happens. Let's get you back in.
          </h1>
          <p className="mt-4 text-forest-100/80">
            Enter your email and we'll send a link to set a new password.
          </p>
          <div className="mt-8 flex items-center gap-3 text-sm text-forest-100/70">
            <GraduationCap size={18} className="text-gold-300" />
            Trusted by forward-thinking schools across Lagos.
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
            <span className="font-display text-2xl text-ink">Sembly</span>
          </div>

          {sent ? (
            <>
              <div className="mb-2 flex items-center gap-2 text-forest-600">
                <MailCheck size={22} />
                <h2 className="font-display text-3xl text-ink">Check your email</h2>
              </div>
              <p className="mt-1.5 text-sm text-ink/55">
                If an account exists for <span className="font-medium text-ink">{email}</span>,
                a reset link is on its way. It expires in 60 minutes.
              </p>
              <Link
                href="/login"
                className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-forest-600 hover:underline"
              >
                <ArrowLeft size={15} /> Back to login
              </Link>
            </>
          ) : (
            <>
              <h2 className="font-display text-3xl text-ink">Forgot password?</h2>
              <p className="mt-1.5 text-sm text-ink/55">
                Enter the email on your account and we'll send you a link to
                set a new password.
              </p>

              <form onSubmit={onSubmit} className="mt-8 space-y-4">
                <Input
                  label="Email address"
                  name="email"
                  type="email"
                  icon={Mail}
                  placeholder="you@school.edu.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                />
                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Sending…" : "Send reset link"}
                  {!loading && <ArrowRight size={18} />}
                </Button>
              </form>

              <Link
                href="/login"
                className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-ink/55 hover:text-forest-600 hover:underline"
              >
                <ArrowLeft size={15} /> Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}