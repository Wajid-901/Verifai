"use client";

import { useAuth, useUser } from "@clerk/nextjs";
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
  Copy,
  ClipboardCheck,
  PartyPopper,
  RefreshCw,
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
  const { user } = useUser();

  const [appState, setAppState] = useState<AppState>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [emailCount, setEmailCount] = useState(0);
  const [emails, setEmails] = useState<string[]>([]);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loadingDot, setLoadingDot] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const dotTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startDotAnimation = () => {
    dotTimerRef.current = setInterval(() => {
      setLoadingDot((d) => (d + 1) % 4);
    }, 400);
  };

  const stopDotAnimation = () => {
    if (dotTimerRef.current) {
      clearInterval(dotTimerRef.current);
      dotTimerRef.current = null;
    }
  };

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
    startDotAnimation();
    try {
      const res = await fetch("/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails }),
      });
      if (!res.ok) throw new Error("Server error");
      const data: ValidationResult = await res.json();
      stopDotAnimation();
      setResult(data);
      setAppState("results");
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch {
      stopDotAnimation();
      setErrorMsg("Something went wrong. Please try again.");
      setAppState("error");
    }
  };

  const handleReset = () => {
    setAppState("idle");
    setFileName(null);
    setEmailCount(0);
    setEmails([]);
    setResult(null);
    setErrorMsg(null);
    setCopied(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.valid.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const validPercent =
    result && result.total > 0
      ? Math.round((result.valid.length / result.total) * 100)
      : 0;

  const dots = ".".repeat(loadingDot + 1).padEnd(3, "\u00a0");

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
            <Link href="/pricing" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">Pricing</Link>
          </nav>
          <div className="flex items-center gap-3">
            {isLoaded && isSignedIn ? (
              <div className="flex items-center gap-3">
                <div className="hidden items-center gap-2 md:flex">
                  {user?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.imageUrl} alt={user.fullName ?? "User"} className="h-8 w-8 rounded-full object-cover ring-2 ring-slate-200" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                      {user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? "U"}
                    </div>
                  )}
                  <span className="text-sm font-medium text-slate-700">{user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress}</span>
                </div>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </div>
            ) : (
              <>
                <Link href="/sign-in" className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 md:block">
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md"
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
                    <p className="mt-0.5 text-sm text-slate-500">
                      {appState === "results" && result
                        ? `${result.total} emails processed`
                        : `Upload up to ${FREE_LIMIT} emails — no sign-up required`}
                    </p>
                  </div>
                  {appState === "results" ? (
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
                    >
                      <RefreshCw className="h-3 w-3" /> New upload
                    </button>
                  ) : (
                    <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Free</span>
                  )}
                </div>

                {/* Error banner */}
                {appState === "error" && errorMsg && (
                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-red-800">Something went wrong</p>
                      <p className="mt-0.5 text-sm text-red-600">{errorMsg}</p>
                      {errorMsg.includes("Sign up") && (
                        <Link href="/sign-up" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                          Create free account <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                    <button onClick={handleReset} className="shrink-0 text-red-400 hover:text-red-600">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Loading state */}
                {appState === "loading" && (
                  <div className="mb-5 overflow-hidden rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
                        <div className="absolute inset-0 animate-ping rounded-full bg-indigo-200 opacity-60" />
                        <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100">
                          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-indigo-900">
                          Cleaning your emails{dots}
                        </p>
                        <p className="text-xs text-indigo-500">Checking syntax, domains & duplicates</p>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-indigo-100">
                      <div className="h-full animate-[loading_1.5s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-indigo-400 to-violet-500" />
                    </div>
                  </div>
                )}

                {/* Success banner */}
                {appState === "results" && result && (
                  <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                      <PartyPopper className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-900">Your email list is ready!</p>
                      <p className="text-xs text-emerald-600">{result.valid.length} clean emails ready to download</p>
                    </div>
                  </div>
                )}

                {/* Drop zone — hidden when results showing */}
                {appState !== "results" && (
                  <button
                    type="button"
                    onClick={() => appState !== "loading" && fileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); if (appState !== "loading") setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    disabled={appState === "loading"}
                    className={cn(
                      "group flex w-full cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed px-6 py-10 transition-all duration-200",
                      appState === "loading" && "cursor-wait opacity-60",
                      isDragging ? "border-indigo-400 bg-indigo-50 scale-[1.01]" :
                      appState === "file_loaded" ? "border-emerald-300 bg-emerald-50" :
                      appState === "error" ? "border-red-200 bg-red-50/30" :
                      "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50"
                    )}
                  >
                    {(appState === "file_loaded" || appState === "loading") && fileName ? (
                      <>
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 transition-transform duration-200 group-hover:scale-105">
                          <FileText className="h-7 w-7 text-emerald-600" />
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-emerald-700">{fileName}</p>
                          <p className="mt-1 text-sm text-slate-500">{emailCount} emails detected</p>
                          {appState !== "loading" && <p className="mt-1 text-xs text-slate-400">Click to replace</p>}
                        </div>
                      </>
                    ) : appState === "idle" || appState === "error" ? (
                      <>
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 transition-transform duration-200 group-hover:scale-110">
                          <Upload className="h-7 w-7 text-indigo-600" />
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-slate-800">
                            {appState === "error" ? "Try another file" : "Upload a file to get started"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Drop here or <span className="font-medium text-indigo-600">browse to upload</span>
                          </p>
                          <p className="mt-2 text-xs text-slate-400">.csv or .txt — up to {FREE_LIMIT} emails free</p>
                        </div>
                      </>
                    ) : null}
                  </button>
                )}
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} />

                {/* Validate button — only when file loaded */}
                {(appState === "file_loaded" || appState === "loading") && (
                  <button
                    type="button"
                    onClick={handleValidate}
                    disabled={appState === "loading"}
                    className={cn(
                      "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold text-white shadow-md transition-all duration-200",
                      appState === "loading"
                        ? "cursor-wait bg-indigo-400 shadow-none"
                        : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:scale-[0.98]"
                    )}
                  >
                    {appState === "loading" ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Cleaning your emails{dots}</>
                    ) : (
                      <>Validate Emails <ArrowRight className="h-4 w-4" /></>
                    )}
                  </button>
                )}

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
              <div ref={resultsRef} className="mx-auto mt-8 max-w-2xl space-y-5">

                {/* Stats cards */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Total", value: result.total, color: "text-slate-900", bg: "bg-white", border: "border-slate-200", sub: "emails processed" },
                    { label: "Valid", value: result.valid.length, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", sub: "deliverable" },
                    { label: "Invalid", value: result.invalid.length, color: "text-red-500", bg: "bg-red-50", border: "border-red-200", sub: "removed" },
                  ].map(({ label, value, color, bg, border, sub }) => (
                    <div key={label} className={cn("rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:scale-[1.03] hover:shadow-md", bg, border)}>
                      <p className={cn("text-3xl font-extrabold tabular-nums", color)}>{value}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
                      <p className="text-xs text-slate-400">{sub}</p>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                  <div className="mb-2 flex items-center justify-between text-xs font-medium">
                    <span className="text-emerald-600">{validPercent}% deliverable rate</span>
                    <span className="text-slate-400">{result.total} total</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
                      style={{ width: `${validPercent}%` }}
                    />
                  </div>
                </div>

                {/* Action buttons */}
                {result.valid.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => downloadTxt("clean_emails.txt", result.valid.join("\n"))}
                      className="group inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg active:scale-[0.98]"
                    >
                      <Download className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
                      Download Clean List ({result.valid.length})
                    </button>
                    <button
                      onClick={handleCopy}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]",
                        copied
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      {copied ? (
                        <><ClipboardCheck className="h-4 w-4" /> Copied!</>
                      ) : (
                        <><Copy className="h-4 w-4" /> Copy Valid Emails</>
                      )}
                    </button>
                  </div>
                )}

                {/* Email lists */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="grid grid-cols-2 divide-x divide-slate-200">
                    <div>
                      <div className="flex items-center gap-2 border-b border-slate-200 bg-emerald-50 px-5 py-3.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm font-semibold text-emerald-800">Valid ({result.valid.length})</span>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {result.valid.length === 0 ? (
                          <p className="px-5 py-8 text-center text-sm text-slate-400">No valid emails found</p>
                        ) : (
                          <ul className="divide-y divide-slate-100">
                            {result.valid.map((email, i) => (
                              <li key={i} className="flex items-center gap-2 px-5 py-2.5 transition-colors hover:bg-emerald-50/50">
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
                          <p className="px-5 py-8 text-center text-sm text-slate-400">No invalid emails!</p>
                        ) : (
                          <ul className="divide-y divide-slate-100">
                            {result.invalid.map((email, i) => (
                              <li key={i} className="flex items-center gap-2 px-5 py-2.5 transition-colors hover:bg-red-50/50">
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
                  <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-6 text-center">
                    <p className="font-semibold text-indigo-900">Save your results & track history</p>
                    <p className="mt-1 text-sm text-indigo-700">Create a free account to access your dashboard, view history, and process unlimited emails with Pro.</p>
                    <Link href="/sign-up" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md">
                      Create free account <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Stats */}
            <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4">
              {stats.map(({ value, label }) => (
                <div key={label} className="rounded-xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md">
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
                <div key={title} className={cn("rounded-2xl border p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md", border, bg)}>
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
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 transition-all duration-200 hover:shadow-md">
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50 hover:shadow-sm"
                >
                  Get started free
                </Link>
              </div>

              {/* Pro */}
              <div className="relative rounded-2xl border-2 border-indigo-600 bg-white p-8 shadow-xl shadow-indigo-100 transition-all duration-200 hover:shadow-2xl hover:shadow-indigo-100">
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg"
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
                <div key={name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
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
              <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-indigo-700 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg">
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
