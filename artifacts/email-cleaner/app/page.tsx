import Link from "next/link";
import { Sparkles, CheckCircle2, Zap, ShieldCheck, Download, ArrowRight, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/layout/Navbar";
import UploadWidget from "@/components/upload/UploadWidget";
import FeaturesSection from "@/components/home/FeaturesSection";
import type { UserProfile } from "@/types";

export default async function Home() {
  let profile: UserProfile | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) { profile = {
      id: user.id, email: user.email ?? null,
      full_name: user.user_metadata?.full_name ?? null,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      plan: "free", created_at: user.created_at,
    }; }
  } catch { /* Supabase not configured yet */ }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <Navbar user={profile} activePage="home" />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-6 pb-16 pt-20">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-100/40 blur-3xl" />
            <div className="absolute right-0 top-40 h-[300px] w-[400px] rounded-full bg-purple-100/30 blur-3xl" />
          </div>

          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Trusted by 50,000+ marketers worldwide
              </span>
            </div>

            <h1 className="mx-auto max-w-3xl text-center text-5xl font-extrabold leading-[1.1] tracking-tight text-slate-900 md:text-6xl">
              Clean Your Email Lists{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                in Seconds
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-center text-lg leading-relaxed text-slate-500">
              Upload, validate, and download high-quality email lists instantly.
              Remove invalid, duplicate, and risky addresses with one click.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {[
                { icon: Zap, label: "Fast processing" },
                { icon: ShieldCheck, label: "Accurate validation" },
                { icon: Download, label: "Clean export" },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {label}
                </span>
              ))}
            </div>

            <div className="mx-auto mt-12 max-w-2xl">
              <UploadWidget />
            </div>
          </div>
        </section>

        <FeaturesSection />

        {/* CTA */}
        <section className="px-6 py-16">
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 px-8 py-14 text-center shadow-2xl shadow-indigo-200">
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
            <h2 className="text-3xl font-extrabold text-white">
              Ready to clean your first list?
            </h2>
            <p className="mt-3 text-indigo-200">
              No credit card. No commitment. Start for free in seconds.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-indigo-700 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                Create free account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10"
              >
                Go to dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
              <Mail className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-base font-bold text-slate-900">
              Email<span className="text-indigo-600">Cleaner</span>
            </span>
          </div>
          <p className="text-sm text-slate-400">
            © 2026 EmailCleaner, Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Support"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm text-slate-500 transition-colors hover:text-slate-900"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
