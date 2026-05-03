"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useRef, useCallback } from "react";
import Link from "next/link";
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
  Loader2,
  XCircle,
  AlertCircle,
  FileText,
  Crown,
  Check,
  LayoutDashboard,
} from "lucide-react";

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

interface ValidationResult {
  valid: string[];
  invalid: string[];
  total: number;
}

type AppState = "idle" | "file_loaded" | "loading" | "results" | "error";

const FREE_LIMIT = 100;

const features = [
  {
    icon: Zap,
    title: "Fast Processing",
    description: "Validate thousands of emails in seconds with our high-performance engine.",
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    icon: ShieldCheck,
    title: "Accurate Validation",
    description: "Syntax checks, domain verification, and disposable email detection — all built in.",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    icon: Download,
    title: "Clean Export",
    description: "Download a pristine, deduplicated list ready for your next campaign.",
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
  { name: "Sarah K.", role: "Email Marketing Lead", text: "Our bounce rate dropped by 78% after switching to Email Cleaner. Game changer.", stars: 5 },
  { name: "Marcus L.", role: "Growth Engineer", text: "Fastest validation tool I've ever used. Upload, clean, download — done in seconds.", stars: 5 },
  { name: "Priya R.", role: "Head of CRM", text: "The accuracy is unreal. Caught thousands of invalid emails our old tool missed.", stars: 5 },
];

function extractEmails(content: string): string[] {
  return content.split(/[\r\n,;]+/).map((l) => l.trim()).filter(Boolean);
}

function downloadTxt(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();

  const [appState, setAppState] = useState<AppState>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [emailCount, setEmailCount] = useState(0);
  const [emails, setEmails] = useState<string[]>([]);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const processFile = useCallback((file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "txt") {
      setErrorMsg("Invalid file type. Please upload a .csv or .txt file.");
      setAppState("error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const extracted = extractEmails(content);
      if (extracted.length > FREE_LIMIT) {
        setErrorMsg(
          `Free trial is limited to ${FREE_LIMIT} emails. Your file has ${extracted.length}. Sign up for a free account to get started, or upgrade to Pro for unlimited.`
        );
        setAppState("error");
        return;
      }
      setFileName(file.name);
      setEmails(extracted);
      setEmailCount(extracted.length);
      setResult(null);
      setErrorMsg(null);
      setAppState("file_loaded");
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleValidate = async () => {
    if (!emails.length) return;
    setAppState("loading");
    setResult(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });
      if (!res.ok) throw new Error("Server error");
      const data: ValidationResult = await res.json();
      setResult(data);
      setAppState("results");
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setAppState("error");
    }
  };

  const validPercent =
    result && result.total > 0
      ? Math.round((result.valid.length / result.total) * 100)
      : 0;

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
            <a href="#features" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">Features</a>
            <a href="#pricing" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            {isLoaded && isSignedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 md:block">
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700"
                >
                  Get started <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

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
              Upload, validate, and download high-quality email lists instantly. Remove invalid, duplicate, and risky addresses with one click.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {[
                { icon: Zap, label: "Fast processing" },
                { icon: ShieldCheck, label: "Accurate validation" },
                { icon: Download, label: "Clean export" },
              ].map(({ icon: Icon, label }) => (
                <span key={label} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  {label}
                </span>
              ))}
            </div>

            {/* Upload Card */}
            <div className="mx-auto mt-12 max-w-2xl">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Try it free</h2>
                    <p className="mt-0.5 text-sm text-slate-500">Upload up to {FREE_LIMIT} emails — no sign-up required</p>
                  </div>
                  <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Free</span>
                </div>

                {appState === "error" && errorMsg && (
                  <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <div>
                      <p className="text-sm text-red-700">{errorMsg}</p>
                      {errorMsg.includes("Sign up") && (
                        <Link href="/sign-up" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600">
                          Create free account <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={cn(
                    "group flex w-full cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed px-6 py-10 transition-all duration-200",
                    isDragging ? "border-indigo-400 bg-indigo-50" :
                    (appState === "file_loaded" || appState === "results") ? "border-emerald-300 bg-emerald-50" :
                    appState === "error" ? "border-red-300 bg-red-50/30" :
                    "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50"
                  )}
                >
                  {(appState === "file_loaded" || appState === "results" || appState === "loading") && fileName ? (
                    <>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                        <FileText className="h-7 w-7 text-emerald-600" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-emerald-700">{fileName}</p>
                        <p className="mt-1 text-sm text-slate-500">{emailCount} emails detected · Click to replace</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 transition-transform duration-200 group-hover:scale-105">
                        <Upload className="h-7 w-7 text-indigo-600" />
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-slate-800">Drop your file here</p>
                        <p className="mt-1 text-sm text-slate-500">or <span className="font-medium text-indigo-600">browse to upload</span></p>
                        <p className="mt-2 text-xs text-slate-400">.csv or .txt — up to {FREE_LIMIT} emails free</p>
                      </div>
                    </>
                  )}
                </button>
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} />

                <button
                  type="button"
                  onClick={handleValidate}
                  disabled={appState !== "file_loaded" || emailCount === 0}
                  className={cn(
                    "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold text-white shadow-md transition-all duration-200",
                    appState === "file_loaded" && emailCount > 0
                      ? "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:scale-[0.99]"
                      : appState === "loading"
                      ? "cursor-wait bg-indigo-400 shadow-none"
                      : "cursor-not-allowed bg-slate-300 shadow-none"
                  )}
                >
                  {appState === "loading" ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Validating emails…</>
                  ) : appState === "file_loaded" && emailCount > 0 ? (
                    <>Validate Emails <ArrowRight className="h-4 w-4" /></>
                  ) : (
                    "Upload a file to continue"
                  )}
                </button>
                <p className="mt-4 text-center text-xs text-slate-400">
                  Need more?{" "}
                  <Link href="/sign-up" className="font-medium text-indigo-600 hover:text-indigo-700">
                    Create a free account
                  </Link>{" "}
                  or{" "}
                  <a href="#pricing" className="font-medium text-indigo-600 hover:text-indigo-700">
                    see Pro plans
                  </a>
                </p>
              </div>
            </div>

            {/* Results */}
            {appState === "results" && result && (
              <div ref={resultsRef} className="mx-auto mt-8 max-w-4xl space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-3 flex items-center justify-between text-sm font-medium">
                    <span className="text-emerald-600">{result.valid.length} valid</span>
                    <span className="text-slate-500">{result.total} total</span>
                    <span className="text-red-500">{result.invalid.length} invalid</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700" style={{ width: `${validPercent}%` }} />
                  </div>
                  <p className="mt-2 text-right text-xs text-slate-400">{validPercent}% deliverable</p>
                </div>

                {result.valid.length > 0 && (
                  <button
                    onClick={() => downloadTxt("clean_emails.txt", result.valid.join("\n"))}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700"
                  >
                    <Download className="h-4 w-4" /> Download Clean Emails ({result.valid.length})
                  </button>
                )}

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="grid grid-cols-2 divide-x divide-slate-200">
                    <div>
                      <div className="flex items-center gap-2 border-b border-slate-200 bg-emerald-50 px-5 py-3.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-semibold text-emerald-800">Valid ({result.valid.length})</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {result.valid.length === 0 ? (
                          <p className="px-5 py-8 text-center text-sm text-slate-400">No valid emails</p>
                        ) : (
                          <ul className="divide-y divide-slate-100">
                            {result.valid.map((email, i) => (
                              <li key={i} className="flex items-center gap-2 px-5 py-2.5 hover:bg-slate-50">
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                                <span className="truncate font-mono text-xs text-slate-700">{email}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 border-b border-slate-200 bg-red-50 px-5 py-3.5">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-semibold text-red-800">Invalid ({result.invalid.length})</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {result.invalid.length === 0 ? (
                          <p className="px-5 py-8 text-center text-sm text-slate-400">No invalid emails</p>
                        ) : (
                          <ul className="divide-y divide-slate-100">
                            {result.invalid.map((email, i) => (
                              <li key={i} className="flex items-center gap-2 px-5 py-2.5 hover:bg-slate-50">
                                <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                                <span className="truncate font-mono text-xs text-slate-700">{email}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {!isSignedIn && (
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 text-center">
                    <p className="font-semibold text-indigo-900">Save your results & track history</p>
                    <p className="mt-1 text-sm text-indigo-700">Create a free account to access your dashboard, view history, and clean unlimited lists with Pro.</p>
                    <Link href="/sign-up" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">
                      Create free account <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4">
              {stats.map(({ value, label }) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm">
                  <p className="text-2xl font-extrabold text-slate-900">{value}</p>
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
              <h2 className="text-3xl font-bold text-slate-900">Everything you need for a clean list</h2>
              <p className="mt-3 text-slate-500">Built for email marketers, growth teams, and anyone who cares about deliverability.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {features.map(({ icon: Icon, title, description, color, bg, border }) => (
                <div key={title} className={cn("rounded-2xl border p-7 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md", border, bg)}>
                  <div className={cn("mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm border", border)}>
                    <Icon className={cn("h-5 w-5", color)} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="bg-white px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-slate-900">Simple, transparent pricing</h2>
              <p className="mt-3 text-slate-500">Start free. Scale when you need to.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              {/* Free */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
                <div className="mb-6">
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Free</p>
                  <p className="mt-2 text-4xl font-extrabold text-slate-900">$0</p>
                  <p className="mt-1 text-slate-500">Forever free</p>
                </div>
                <ul className="mb-8 space-y-3">
                  {["Up to 100 emails per upload", "Basic email validation", "CSV & TXT support", "Instant download", "No credit card required"].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-slate-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/sign-up"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50"
                >
                  Get started free
                </Link>
              </div>

              {/* Pro */}
              <div className="relative rounded-2xl border-2 border-indigo-600 bg-white p-8 shadow-xl shadow-indigo-100">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-1 text-xs font-bold text-white">
                    <Crown className="h-3 w-3" /> Most Popular
                  </span>
                </div>
                <div className="mb-6">
                  <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Pro</p>
                  <p className="mt-2 text-4xl font-extrabold text-slate-900">$19<span className="text-lg font-medium text-slate-500">/mo</span></p>
                  <p className="mt-1 text-slate-500">Billed monthly</p>
                </div>
                <ul className="mb-8 space-y-3">
                  {["Unlimited emails per upload", "Advanced validation + MX check", "Dashboard & upload history", "Bulk CSV export", "Priority processing", "Email support"].map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-slate-700">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/sign-up"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg"
                >
                  Get started <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-slate-900">Loved by email professionals</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map(({ name, role, text, stars }) => (
                <div key={name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-3 flex gap-0.5">
                    {Array.from({ length: stars }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700">&ldquo;{text}&rdquo;</p>
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-slate-900">{name}</p>
                    <p className="text-xs text-slate-500">{role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20">
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 px-8 py-16 text-center shadow-2xl shadow-indigo-200">
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">Start cleaning for free today</h2>
            <p className="mt-4 text-indigo-200">No credit card required. First 100 emails are on us.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-indigo-700 shadow-md transition-all hover:shadow-lg">
                Create free account <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#pricing" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10">
                View pricing
              </a>
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
            <span className="text-base font-bold text-slate-900">Email<span className="text-indigo-600">Cleaner</span></span>
          </div>
          <p className="text-sm text-slate-400">© 2026 EmailCleaner, Inc. All rights reserved.</p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Support"].map((item) => (
              <a key={item} href="#" className="text-sm text-slate-500 transition-colors hover:text-slate-900">{item}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
