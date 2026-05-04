"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  FileText,
  Loader2,
  AlertCircle,
  Zap,
  Crown,
  History,
  LogOut,
  Mail,
  ArrowRight,
  TrendingUp,
  Inbox,
  Copy,
  ClipboardCheck,
  PartyPopper,
  RefreshCw,
  LayoutDashboard,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

const FREE_LIMIT = 100;

interface UploadRecord {
  id: string;
  fileName: string;
  total: number;
  valid: number;
  invalid: number;
  date: string;
}

interface ValidationResult {
  valid: string[];
  invalid: string[];
  total: number;
}

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

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) setValue(JSON.parse(stored) as T);
    } catch { /* ignore */ }
  }, [key]);
  const set = (v: T) => {
    setValue(v);
    localStorage.setItem(key, JSON.stringify(v));
  };
  return [value, set] as const;
}

type PageState = "idle" | "file_loaded" | "loading" | "results" | "error";
type ActiveTab = "dashboard" | "upload" | "history";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const [plan] = useLocalStorage<"free" | "pro">("ec_plan", "free");
  const [totalCleaned, setTotalCleaned] = useLocalStorage("ec_total_cleaned", 0);
  const [totalUploads, setTotalUploads] = useLocalStorage("ec_total_uploads", 0);
  const [history, setHistory] = useLocalStorage<UploadRecord[]>("ec_history", []);

  const [pageState, setPageState] = useState<PageState>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [emailCount, setEmailCount] = useState(0);
  const [emails, setEmails] = useState<string[]>([]);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loadingDot, setLoadingDot] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const dotTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");

  const startDotAnimation = () => {
    dotTimerRef.current = setInterval(() => setLoadingDot((d) => (d + 1) % 4), 400);
  };
  const stopDotAnimation = () => {
    if (dotTimerRef.current) { clearInterval(dotTimerRef.current); dotTimerRef.current = null; }
  };

  const processFile = useCallback((file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "csv" && ext !== "txt") {
      setErrorMsg("Invalid file type. Upload a .csv or .txt file.");
      setPageState("error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const extracted = extractEmails(content);
      if (plan === "free" && extracted.length > FREE_LIMIT) {
        setErrorMsg(`Free plan is limited to ${FREE_LIMIT} emails per upload. Your file has ${extracted.length} emails. Upgrade to Pro for unlimited.`);
        setPageState("error");
        return;
      }
      setFileName(file.name);
      setEmails(extracted);
      setEmailCount(extracted.length);
      setResult(null);
      setErrorMsg(null);
      setPageState("file_loaded");
    };
    reader.readAsText(file);
  }, [plan]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleValidate = async () => {
    if (!emails.length) return;
    setPageState("loading");
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
      setPageState("results");
      const newRecord: UploadRecord = {
        id: Date.now().toString(),
        fileName: fileName ?? "upload.txt",
        total: data.total,
        valid: data.valid.length,
        invalid: data.invalid.length,
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      };
      setHistory([newRecord, ...history].slice(0, 20));
      setTotalCleaned(totalCleaned + data.valid.length);
      setTotalUploads(totalUploads + 1);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch {
      stopDotAnimation();
      setErrorMsg("Validation failed. Please try again.");
      setPageState("error");
    }
  };

  const handleReset = () => {
    setPageState("idle");
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

  const goToUpload = () => {
    handleReset();
    setActiveTab("upload");
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const validPercent = result && result.total > 0 ? Math.round((result.valid.length / result.total) * 100) : 0;
  const dots = ".".repeat(loadingDot + 1).padEnd(3, "\u00a0");
  const overallRate = totalCleaned > 0 && totalUploads > 0 ? Math.round((totalCleaned / (totalCleaned + history.reduce((a, r) => a + r.invalid, 0))) * 100) : 0;

  const navItems: { id: ActiveTab; icon: React.ElementType; label: string }[] = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "upload", icon: Upload, label: "Upload" },
    { id: "history", icon: History, label: "History" },
  ];

  const userInitial = user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? "U";
  const userName = user?.fullName ?? user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? "there";

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white">
        {/* Logo */}
        <Link href="/" className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-5 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <Mail className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-slate-900">
            Email<span className="text-indigo-600">Cleaner</span>
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {navItems.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                activeTab === id
                  ? "bg-indigo-50 text-indigo-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {id === "history" && history.length > 0 && (
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  {history.length}
                </span>
              )}
            </button>
          ))}

          <div className="my-3 border-t border-slate-100" />

          <Link
            href="/pricing"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"
          >
            <Sparkles className="h-4 w-4 shrink-0" />
            Pricing
          </Link>
        </nav>

        {/* Plan badge */}
        <div className="border-t border-slate-100 px-4 pb-3 pt-4">
          {plan === "free" ? (
            <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-3.5">
              <div className="mb-1.5 flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-indigo-600" />
                <span className="text-xs font-bold text-indigo-900">Free Plan</span>
              </div>
              <p className="mb-3 text-xs leading-relaxed text-indigo-700">
                Limited to {FREE_LIMIT} emails per upload.
              </p>
              <Link
                href="/pricing"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-indigo-700 hover:shadow-sm"
              >
                <Crown className="h-3 w-3" />
                Upgrade to Pro
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-3.5">
              <div className="flex items-center gap-2">
                <Crown className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-xs font-bold text-amber-900">Pro Plan</span>
              </div>
              <p className="mt-1 text-xs text-amber-700">Unlimited emails per upload</p>
            </div>
          )}
        </div>

        {/* User + sign out */}
        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 flex items-center gap-3">
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.imageUrl} alt={userName} className="h-8 w-8 rounded-full object-cover ring-2 ring-slate-100" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                {userInitial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
              <p className="truncate text-xs text-slate-400">{user?.emailAddresses?.[0]?.emailAddress}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl px-8 py-10">

          {/* ─────────────────── DASHBOARD TAB ─────────────────── */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Header */}
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Welcome back, {user?.firstName ?? "there"} 👋
                </h1>
                <p className="mt-1 text-slate-500">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  {
                    icon: TrendingUp, value: totalCleaned.toLocaleString(),
                    label: "Emails cleaned", iconBg: "bg-indigo-50", iconColor: "text-indigo-600",
                    border: "border-slate-200",
                  },
                  {
                    icon: Upload, value: String(totalUploads),
                    label: "Total uploads", iconBg: "bg-emerald-50", iconColor: "text-emerald-600",
                    border: "border-slate-200",
                  },
                  {
                    icon: CheckCircle2, value: totalUploads > 0 ? `${overallRate}%` : "—",
                    label: "Avg. valid rate", iconBg: "bg-teal-50", iconColor: "text-teal-600",
                    border: "border-slate-200",
                  },
                  {
                    icon: Zap, value: plan === "free" ? `${FREE_LIMIT}` : "∞",
                    label: "Email limit", iconBg: "bg-violet-50", iconColor: "text-violet-600",
                    border: plan === "pro" ? "border-amber-200" : "border-slate-200",
                  },
                ].map(({ icon: Icon, value, label, iconBg, iconColor, border }) => (
                  <div key={label} className={cn("rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md", border)}>
                    <div className={cn("mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl", iconBg)}>
                      <Icon className={cn("h-4.5 w-4.5", iconColor)} />
                    </div>
                    <p className="text-2xl font-extrabold tabular-nums text-slate-900">{value}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  onClick={goToUpload}
                  className="group flex items-center justify-between rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
                      <Upload className="h-5 w-5 text-white" />
                    </div>
                    <p className="font-bold text-slate-900">Upload New File</p>
                    <p className="mt-0.5 text-sm text-slate-500">Clean your next email list</p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-indigo-400 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>

                <button
                  onClick={() => setActiveTab("history")}
                  className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div>
                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 shadow-sm">
                      <History className="h-5 w-5 text-slate-600" />
                    </div>
                    <p className="font-bold text-slate-900">View History</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {history.length > 0 ? `${history.length} previous upload${history.length !== 1 ? "s" : ""}` : "No uploads yet"}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5" />
                </button>
              </div>

              {/* Recent activity */}
              {history.length > 0 && (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-bold text-slate-900">Recent uploads</h2>
                    <button
                      onClick={() => setActiveTab("history")}
                      className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      View all →
                    </button>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">File</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Valid</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {history.slice(0, 5).map((rec) => {
                          const rate = rec.total > 0 ? Math.round((rec.valid / rec.total) * 100) : 0;
                          return (
                            <tr key={rec.id} className="transition-colors hover:bg-slate-50">
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                                  <span className="max-w-[180px] truncate font-medium text-slate-800">{rec.fileName}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-500">{rec.date}</td>
                              <td className="px-4 py-3 text-center font-medium text-emerald-600">{rec.valid}</td>
                              <td className="px-4 py-3 text-center">
                                <span className={cn(
                                  "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                  rate >= 80 ? "bg-emerald-100 text-emerald-700" :
                                  rate >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                                )}>{rate}%</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* First-time empty state */}
              {history.length === 0 && (
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
                    <Upload className="h-7 w-7 text-indigo-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">No uploads yet</p>
                    <p className="mt-1 text-sm text-slate-400">Upload your first email list to see stats here</p>
                  </div>
                  <button
                    onClick={goToUpload}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md"
                  >
                    <Upload className="h-4 w-4" /> Upload your first list
                  </button>
                </div>
              )}

              {/* Upgrade CTA for free users */}
              {plan === "free" && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-6 text-white shadow-lg">
                  <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 translate-x-8 -translate-y-8 rounded-full bg-white/10 blur-2xl" />
                  <div className="pointer-events-none absolute bottom-0 left-20 h-24 w-24 rounded-full bg-violet-400/20 blur-xl" />
                  <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="mb-1.5 flex items-center gap-2">
                        <Crown className="h-4 w-4 text-amber-300" />
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">Pro Plan</span>
                      </div>
                      <h3 className="text-lg font-bold">Unlock unlimited email validation</h3>
                      <p className="mt-1 text-sm text-indigo-200">Process millions of emails, advanced MX checks, priority speed.</p>
                    </div>
                    <Link
                      href="/pricing"
                      className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      View pricing <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─────────────────── UPLOAD TAB ─────────────────── */}
          {activeTab === "upload" && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Upload</h1>
                  <p className="mt-1 text-slate-500">
                    {plan === "free" ? `Free plan: up to ${FREE_LIMIT} emails per upload` : "Pro plan: unlimited emails"}
                  </p>
                </div>
                {pageState === "results" && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
                  >
                    <RefreshCw className="h-3 w-3" /> New upload
                  </button>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                {/* Error banner */}
                {pageState === "error" && errorMsg && (
                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-red-800">Upload failed</p>
                      <p className="mt-0.5 text-sm text-red-600">{errorMsg}</p>
                      {errorMsg.includes("Upgrade") && (
                        <Link href="/pricing" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                          See Pro plans <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                    <button onClick={handleReset} className="shrink-0 text-red-400 hover:text-red-600">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Loading banner */}
                {pageState === "loading" && (
                  <div className="mb-5 overflow-hidden rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-violet-50 px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center">
                        <div className="absolute inset-0 animate-ping rounded-full bg-indigo-200 opacity-60" />
                        <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100">
                          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-indigo-900">Cleaning your emails{dots}</p>
                        <p className="text-xs text-indigo-500">Checking syntax, domains & duplicates</p>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-indigo-100">
                      <div className="h-full animate-[loading_1.5s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-indigo-400 to-violet-500" />
                    </div>
                  </div>
                )}

                {/* Success banner */}
                {pageState === "results" && result && (
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

                {/* Drop zone */}
                {pageState !== "results" && (
                  <button
                    type="button"
                    onClick={() => pageState !== "loading" && fileRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); if (pageState !== "loading") setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    disabled={pageState === "loading"}
                    className={cn(
                      "group flex w-full cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 transition-all duration-200",
                      pageState === "loading" ? "cursor-wait opacity-60" : "",
                      isDragging ? "scale-[1.01] border-indigo-400 bg-indigo-50" :
                      pageState === "file_loaded" ? "border-emerald-300 bg-emerald-50" :
                      pageState === "error" ? "border-red-200 bg-red-50/30" :
                      "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/40"
                    )}
                  >
                    {(pageState === "file_loaded" || pageState === "loading") && fileName ? (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 transition-transform duration-200 group-hover:scale-105">
                          <FileText className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-emerald-700">{fileName}</p>
                          <p className="text-sm text-slate-500">{emailCount} emails detected</p>
                          {pageState !== "loading" && <p className="text-xs text-slate-400">Click to replace</p>}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 transition-transform duration-200 group-hover:scale-110">
                          <Upload className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-slate-800">
                            {pageState === "error" ? "Try another file" : "Upload a file to get started"}
                          </p>
                          <p className="text-sm text-slate-500">
                            Drop here or <span className="font-medium text-indigo-600">browse to upload</span>
                          </p>
                          <p className="mt-1 text-xs text-slate-400">.csv or .txt files only</p>
                        </div>
                      </>
                    )}
                  </button>
                )}
                <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} />

                {/* Validate button */}
                {(pageState === "file_loaded" || pageState === "loading") && (
                  <button
                    onClick={handleValidate}
                    disabled={pageState === "loading"}
                    className={cn(
                      "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200",
                      pageState === "loading"
                        ? "cursor-wait bg-indigo-400 shadow-none"
                        : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-md active:scale-[0.98]"
                    )}
                  >
                    {pageState === "loading"
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Cleaning your emails{dots}</>
                      : <>Validate Emails <ArrowRight className="h-4 w-4" /></>}
                  </button>
                )}
              </div>

              {/* Results */}
              {pageState === "results" && result && (
                <div ref={resultsRef} className="space-y-5">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Total", value: result.total, color: "text-slate-900", bg: "bg-white", border: "border-slate-200", sub: "processed" },
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

                  <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
                    <div className="mb-2 flex items-center justify-between text-xs font-medium">
                      <span className="text-emerald-600">{validPercent}% deliverable rate</span>
                      <span className="text-slate-400">{result.total} total emails</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700" style={{ width: `${validPercent}%` }} />
                    </div>
                  </div>

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
                          copied ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        {copied ? <><ClipboardCheck className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy Valid Emails</>}
                      </button>
                    </div>
                  )}

                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="grid grid-cols-2 divide-x divide-slate-200">
                      <div>
                        <div className="flex items-center gap-2 border-b border-slate-200 bg-emerald-50 px-5 py-3">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm font-semibold text-emerald-800">Valid ({result.valid.length})</span>
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                          {result.valid.length === 0
                            ? <p className="px-5 py-6 text-center text-sm text-slate-400">None</p>
                            : <ul className="divide-y divide-slate-100">
                                {result.valid.map((email, i) => (
                                  <li key={i} className="flex items-center gap-2 px-5 py-2 transition-colors hover:bg-emerald-50/50">
                                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                                    <span className="truncate font-mono text-xs text-slate-700">{email}</span>
                                  </li>
                                ))}
                              </ul>}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 border-b border-slate-200 bg-red-50 px-5 py-3">
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm font-semibold text-red-800">Invalid ({result.invalid.length})</span>
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                          {result.invalid.length === 0
                            ? <p className="px-5 py-6 text-center text-sm text-slate-400">None</p>
                            : <ul className="divide-y divide-slate-100">
                                {result.invalid.map((email, i) => (
                                  <li key={i} className="flex items-center gap-2 px-5 py-2 transition-colors hover:bg-red-50/50">
                                    <XCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                                    <span className="truncate font-mono text-xs text-slate-700">{email}</span>
                                  </li>
                                ))}
                              </ul>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─────────────────── HISTORY TAB ─────────────────── */}
          {activeTab === "history" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">History</h1>
                <p className="mt-1 text-slate-500">All your previous validation runs</p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center gap-4 py-20">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                      <Inbox className="h-7 w-7 text-slate-400" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-slate-700">No uploads yet</p>
                      <p className="mt-1 text-sm text-slate-400">Your validation history will appear here</p>
                    </div>
                    <button
                      onClick={goToUpload}
                      className="mt-2 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md"
                    >
                      <Upload className="h-4 w-4" /> Upload your first list
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50 text-left">
                          <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">File</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Valid</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Invalid</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {history.map((rec) => {
                          const rate = rec.total > 0 ? Math.round((rec.valid / rec.total) * 100) : 0;
                          return (
                            <tr key={rec.id} className="transition-colors hover:bg-slate-50">
                              <td className="px-6 py-3.5">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                                  <span className="max-w-[160px] truncate font-medium text-slate-800">{rec.fileName}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-slate-500">{rec.date}</td>
                              <td className="px-4 py-3.5 text-center text-slate-700">{rec.total}</td>
                              <td className="px-4 py-3.5 text-center font-medium text-emerald-600">{rec.valid}</td>
                              <td className="px-4 py-3.5 text-center font-medium text-red-500">{rec.invalid}</td>
                              <td className="px-4 py-3.5 text-center">
                                <span className={cn(
                                  "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                  rate >= 80 ? "bg-emerald-100 text-emerald-700" :
                                  rate >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                                )}>{rate}%</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
