"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: authError, data } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (authError) { setError(authError.message); setLoading(false); return; }
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <header className="px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <Mail className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">
            Email<span className="text-indigo-600">Cleaner</span>
          </span>
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-[440px]">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
            <p className="mt-1 text-slate-500">Start cleaning email lists for free</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
            {success ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Check your email</p>
                  <p className="mt-1 text-sm text-slate-500">
                    We sent a confirmation link to <span className="font-medium text-slate-700">{email}</span>.
                    Click it to activate your account.
                  </p>
                </div>
                <Link href="/sign-in" className="mt-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                  Back to sign in
                </Link>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Email
                    </label>
                    <input
                      id="email" type="email" required autoComplete="email"
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                      Password
                      <span className="ml-1.5 text-xs font-normal text-slate-400">(min. 8 characters)</span>
                    </label>
                    <div className="relative">
                      <input
                        id="password" type={showPassword ? "text" : "password"}
                        required autoComplete="new-password" minLength={8}
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                      />
                      <button
                        type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit" disabled={loading}
                    className={cn(
                      "mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-200",
                      loading ? "cursor-wait bg-indigo-400 shadow-none" : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:scale-[0.98]"
                    )}
                  >
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</> : "Create free account"}
                  </button>
                </form>

                <p className="mt-5 text-center text-xs text-slate-400">
                  By signing up you agree to our{" "}
                  <a href="#" className="text-slate-500 hover:text-slate-700">Terms</a> and{" "}
                  <a href="#" className="text-slate-500 hover:text-slate-700">Privacy Policy</a>.
                </p>

                <p className="mt-4 text-center text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link href="/sign-in" className="font-semibold text-indigo-600 hover:text-indigo-700">
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
