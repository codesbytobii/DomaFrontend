"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { Lock, ArrowRight, GraduationCap, CheckCircle2 } from "lucide-react";
import { setPassword } from "@/lib/auth";
import { getErrorMessage } from "@/lib/utils";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";

/**
 * /set-password?token=...&email=...
 *
 * One page serves two flows, since the backend issues the same kind of token
 * for both (see PasswordResetController + SetPasswordNotification):
 *   - Invite: a school_admin, teacher, or parent's very first login.
 *   - Forgot password: an existing user resetting a lost password.
 * The page can't tell which one it is (and doesn't need to) — it just
 * validates the token by attempting the reset.
 */
function SetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") || "";
  const email = params.get("email") || "";

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const missingLink = !token || !email;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirm) {
      toast.error("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await setPassword({
        email,
        token,
        password: form.password,
        passwordConfirmation: form.confirm,
      });
      setDone(true);
      toast.success("Password set — you can now log in.");
    } catch (err) {
      toast.error(getErrorMessage(err, "That link is invalid or has expired."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left — brand panel (hidden on small screens), matches /login */}
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
            Almost there. Set a password to get started.
          </h1>
          <p className="mt-4 text-forest-100/80">
            One password gets you into results, fees, attendance and parent
            communication — all in one calm place.
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

          {missingLink ? (
            <>
              <h2 className="font-display text-3xl text-ink">Invalid link</h2>
              <p className="mt-1.5 text-sm text-ink/55">
                This set-password link is missing its token. Please use the
                link from your invite or reset email, or request a new one.
              </p>
              <Button className="mt-6 w-full" onClick={() => router.push("/login")}>
                Back to login
              </Button>
            </>
          ) : done ? (
            <>
              <div className="mb-2 flex items-center gap-2 text-forest-600">
                <CheckCircle2 size={22} />
                <h2 className="font-display text-3xl text-ink">Password set</h2>
              </div>
              <p className="mt-1.5 text-sm text-ink/55">
                Your password has been saved. You can now log in with your
                email and new password.
              </p>
              <Button className="mt-6 w-full" onClick={() => router.push("/login")}>
                Go to login <ArrowRight size={16} />
              </Button>
            </>
          ) : (
            <>
              <h2 className="font-display text-3xl text-ink">Set your password</h2>
              <p className="mt-1.5 text-sm text-ink/55">
                {email ? (
                  <>
                    For <span className="font-medium text-ink">{email}</span>.
                    Choose a password to finish setting up your account.
                  </>
                ) : (
                  "Choose a password to finish setting up your account."
                )}
              </p>

              <form onSubmit={onSubmit} className="mt-8 space-y-4">
                <Input
                  label="New password"
                  icon={Lock}
                  type="password"
                  name="password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  autoFocus
                  required
                />
                <Input
                  label="Confirm password"
                  icon={Lock}
                  type="password"
                  name="confirm"
                  placeholder="Re-enter your password"
                  value={form.confirm}
                  onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                  required
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Setting password…" : "Set password"}{" "}
                  {!loading && <ArrowRight size={16} />}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  // useSearchParams needs a Suspense boundary in the app router.
  return (
    <Suspense fallback={null}>
      <SetPasswordForm />
    </Suspense>
  );
}