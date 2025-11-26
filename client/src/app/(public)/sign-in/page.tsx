// app/sign-in/page.tsx
'use client';

import { useState } from 'react';
import { useSignIn, useClerk } from '@clerk/nextjs';
import { z } from 'zod';

const SignInSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type SignInForm = z.infer<typeof SignInSchema>;

export default function SignInPage(): JSX.Element {
  const { isLoaded, signIn } = useSignIn();
  const { setActive } = useClerk();

  const [form, setForm] = useState<SignInForm>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isLoaded) return <div className="min-h-screen bg-slate-50" />;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr(null);

    const parsed = SignInSchema.safeParse(form);
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message ?? 'Invalid input');
      return;
    }

    setLoading(true);
    try {
      const res = await signIn.create({
        identifier: form.email,
        password: form.password,
      });
      if (res.status === 'complete') {
        await setActive({ session: res.createdSessionId! });
        window.location.href =
          process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL ?? '/dashboard';
      }
    } catch (e: any) {
      setErr(e?.errors?.[0]?.message ?? 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const sso = (strategy: Parameters<typeof signIn.authenticateWithRedirect>[0]['strategy']) =>
    signIn.authenticateWithRedirect({
      strategy,
      redirectUrl: '/sso-callback',
      redirectUrlComplete:
        process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL ?? '/dashboard',
    });

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-2 gap-8 px-6 py-16">
        {/* Brand / Marketing side */}
        <section className="hidden md:flex flex-col justify-center rounded-2xl bg-slate-900 p-10 text-slate-100 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              {/* Simple logo mark */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400">
                <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 15h-2v-2h2Zm0-4h-2V7h2Z"/>
              </svg>
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Lab Inventory</h1>
          </div>

          <h2 className="mt-8 text-3xl font-bold leading-tight">
            Secure access to your lab’s operations
          </h2>
          <p className="mt-4 text-slate-300">
            Manage inventory, purchase orders, suppliers, and analytics—all in one place.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">✓</span>
              Enterprise-grade authentication (OAuth + email)
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">✓</span>
              Role-based access for admins, clerks, and staff
            </li>
            <li className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">✓</span>
              Audit trails via stock ledger
            </li>
          </ul>
        </section>

        {/* Auth Card */}
        <section className="flex items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Sign in
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Welcome back! Please sign in to continue.
            </p>

            {/* OAuth buttons */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <OAuthButton label="Google" onClick={() => sso('oauth_google')} />
              <OAuthButton label="Microsoft" onClick={() => sso('oauth_microsoft')} />
              <OAuthButton label="Facebook" onClick={() => sso('oauth_facebook')} />
            </div>

            <Divider label="or use email" />

            {/* Email/password */}
            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none ring-0 transition focus:border-blue-500"
                  placeholder="you@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-slate-900 shadow-sm outline-none ring-0 transition focus:border-blue-500"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute inset-y-0 right-0 mr-2 inline-flex items-center rounded-md p-2 text-slate-500 hover:text-slate-700"
                  >
                    {/* eye icon */}
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 5c-7 0-11 7-11 7s4 7 11 7 11-7 11-7-4-7-11-7Zm0 12a5 5 0 1 1 5-5 5.006 5.006 0 0 1-5 5Z"/>
                      <circle cx="12" cy="12" r="2.5"/>
                    </svg>
                  </button>
                </div>
              </div>

              {err && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 border border-rose-200">
                  {err}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-white font-semibold shadow-sm transition hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>

              <p className="text-sm text-slate-600">
                Don’t have an account?{' '}
                <a href="/sign-up" className="font-medium text-blue-600 hover:text-blue-700 underline underline-offset-4">
                  Sign up
                </a>
              </p>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

/** UI helpers (kept here for clarity) */
function OAuthButton({
  label,
  onClick,
}: {
  label: 'Google' | 'Microsoft' | 'Facebook';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      aria-label={`Continue with ${label}`}
    >
      <span className="h-4 w-4" aria-hidden>
        {/* minimal brand glyphs */}
        {label === 'Google' && (
          <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.3-2.3H12v4.4h6.5c-.3 1.7-1.4 3.2-3 4.1v3.4h4.8c2.8-2.5 4.2-6.2 4.2-9.6z"/><path fill="#34A853" d="M12 24c3.6 0 6.6-1.2 8.8-3.3l-4.8-3.4c-1.3.9-3 .1-4 .1-3.1 0-5.7-2.1-6.6-5H.6v3.5C2.8 21.3 6.9 24 12 24z"/><path fill="#FBBC05" d="M5.4 12c-.2-.7-.3-1.4-.3-2.1s.1-1.4.3-2.1V4.3H.6A12 12 0 0 0 0 9.9 12 12 0 0 0 .6 15.7l4.8-3.7z"/><path fill="#EA4335" d="M12 4.7c1.9 0 3.6.7 4.9 2l3.7-3.7C18.6.9 15.6 0 12 0 6.9 0 2.8 2.7.6 6.3l4.8 3.7C6.3 6.8 8.9 4.7 12 4.7z"/></svg>
        )}
        {label === 'Microsoft' && (
          <svg viewBox="0 0 23 23" className="h-4 w-4"><path fill="#F25022" d="M0 0h10.5v10.5H0z"/><path fill="#7FBA00" d="M12.5 0H23v10.5H12.5z"/><path fill="#00A4EF" d="M0 12.5h10.5V23H0z"/><path fill="#FFB900" d="M12.5 12.5H23V23H12.5z"/></svg>
        )}
        {label === 'Facebook' && (
          <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="#1877F2" d="M22.7 0H1.3C.6 0 0 .6 0 1.3v21.3C0 23.4.6 24 1.3 24h11.5v-9.3H9.8v-3.6h3V8c0-3 1.8-4.6 4.5-4.6 1.3 0 2.6.1 2.9.2v3.4h-2c-1.6 0-2 .8-2 2v2.6h3.9l-.5 3.6h-3.4V24h6.7c.7 0 1.3-.6 1.3-1.3V1.3c0-.7-.6-1.3-1.3-1.3z"/></svg>
        )}
      </span>
      {label}
    </button>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="mt-6 flex items-center gap-3">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}
