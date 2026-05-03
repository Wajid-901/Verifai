"use client";

import { useState, useRef } from "react";
import {
  Zap,
  ShieldCheck,
  Download,
  Upload,
  Mail,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Star,
} from "lucide-react";

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

const features = [
  {
    icon: Zap,
    title: "Fast Processing",
    description:
      "Validate thousands of emails in seconds with our high-performance engine.",
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    icon: ShieldCheck,
    title: "Accurate Validation",
    description:
      "Syntax checks, domain verification, and disposable email detection — all built in.",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    icon: Download,
    title: "Clean Export",
    description:
      "Download a pristine, deduplicated list ready for your next campaign.",
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
];

const stats = [
  { value: "99.8%", label: "Accuracy rate" },
  { value: "< 2s", label: "Average processing" },
  { value: "10M+", label: "Emails cleaned" },
  { value: "50K+", label: "Happy users" },
];

const testimonials = [
  {
    name: "Sarah K.",
    role: "Email Marketing Lead",
    text: "Our bounce rate dropped by 78% after switching to Email Cleaner. Game changer.",
    stars: 5,
  },
  {
    name: "Marcus L.",
    role: "Growth Engineer",
    text: "Fastest validation tool I've ever used. Upload, clean, download — done in seconds.",
    stars: 5,
  },
  {
    name: "Priya R.",
    role: "Head of CRM",
    text: "The accuracy is unreal. Caught thousands of invalid emails our old tool missed.",
    stars: 5,
  },
];

export default function Home() {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setFileName(file.name);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Mail className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">
              Email<span className="text-indigo-600">Cleaner</span>
            </span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              Pricing
            </a>
            <a
              href="#"
              className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            >
              Docs
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="#"
              className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 md:block"
            >
              Sign in
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md"
            >
              Get started
              <ChevronRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="relative overflow-hidden px-6 pb-16 pt-20">
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[500px] w-[900px] -translate-x-1/2 rounded-full bg-indigo-100/40 blur-3xl" />
            <div className="absolute right-0 top-40 h-[300px] w-[400px] rounded-full bg-purple-100/30 blur-3xl" />
          </div>

          <div className="mx-auto max-w-6xl">
            {/* Badge */}
            <div className="mb-8 flex justify-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Trusted by 50,000+ marketers worldwide
              </span>
            </div>

            {/* Heading */}
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

            {/* Feature pills */}
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

            {/* Upload card */}
            <div className="mx-auto mt-12 max-w-2xl">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Upload your list
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500">
                      Supports CSV, TXT, and XLSX files — up to 5MB
                    </p>
                  </div>
                  <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Free to try
                  </span>
                </div>

                {/* Drop zone */}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={cn(
                    "group flex w-full cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed px-6 py-10 transition-all duration-200",
                    isDragging
                      ? "border-indigo-400 bg-indigo-50"
                      : fileName
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50"
                  )}
                >
                  {fileName ? (
                    <>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                        <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-emerald-700">
                          {fileName}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Ready to validate
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 transition-transform duration-200 group-hover:scale-105">
                        <Upload className="h-7 w-7 text-indigo-600" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-slate-800">
                          Drop your file here
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          or{" "}
                          <span className="font-medium text-indigo-600">
                            browse to upload
                          </span>
                        </p>
                      </div>
                    </>
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt,.xlsx"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {/* CTA */}
                <button
                  type="button"
                  className={cn(
                    "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold text-white shadow-md transition-all duration-200",
                    fileName
                      ? "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg"
                      : "cursor-not-allowed bg-slate-300 shadow-none"
                  )}
                  disabled={!fileName}
                >
                  {fileName ? (
                    <>
                      Clean My List
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    "Upload a file to continue"
                  )}
                </button>

                {/* Trust line */}
                <p className="mt-4 text-center text-xs text-slate-400">
                  No sign-up required for your first 500 emails
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4">
              {stats.map(({ value, label }) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm"
                >
                  <p className="text-2xl font-extrabold text-slate-900">
                    {value}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-slate-900">
                Everything you need for a clean list
              </h2>
              <p className="mt-3 text-slate-500">
                Built for email marketers, growth teams, and anyone who cares
                about deliverability.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {features.map(
                ({ icon: Icon, title, description, color, bg, border }) => (
                  <div
                    key={title}
                    className={cn(
                      "rounded-2xl border p-7 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                      border,
                      bg
                    )}
                  >
                    <div
                      className={cn(
                        "mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm",
                        border,
                        "border"
                      )}
                    >
                      <Icon className={cn("h-5 w-5", color)} />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                      {description}
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-white px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-slate-900">
                Loved by email professionals
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map(({ name, role, text, stars }) => (
                <div
                  key={name}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
                >
                  <div className="mb-3 flex gap-0.5">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700">
                    &ldquo;{text}&rdquo;
                  </p>
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {name}
                    </p>
                    <p className="text-xs text-slate-500">{role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 px-8 py-16 text-center shadow-2xl shadow-indigo-200">
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">
              Start cleaning for free today
            </h2>
            <p className="mt-4 text-indigo-200">
              No credit card required. First 500 emails are on us.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-indigo-700 shadow-md transition-all hover:shadow-lg"
              >
                Get started free
                <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10"
              >
                View pricing
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
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
