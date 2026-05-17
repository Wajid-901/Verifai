"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Copy, ClipboardCheck, Download, ArrowRight,
  ChevronDown, ChevronUp, CheckCircle2, AlertTriangle,
  XCircle, Copy as CopyIcon,
} from "lucide-react";
import { cn, downloadTxt, downloadCsv, getValidRate } from "@/lib/utils";
import type { ValidationResult, EmailResult, EmailStatus } from "@/types";

interface ResultsCardsProps {
  result: ValidationResult;
  isAuthenticated?: boolean;
}

const STATUS_CONFIG: Record<EmailStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  valid:     { label: "Valid",      color: "text-emerald-700", bg: "bg-emerald-50",  border: "border-emerald-200", icon: CheckCircle2 },
  risky:     { label: "Risky",      color: "text-amber-700",   bg: "bg-amber-50",    border: "border-amber-200",   icon: AlertTriangle },
  invalid:   { label: "Invalid",    color: "text-red-600",     bg: "bg-red-50",      border: "border-red-200",     icon: XCircle },
  duplicate: { label: "Duplicate",  color: "text-slate-500",   bg: "bg-slate-50",    border: "border-slate-200",   icon: CopyIcon },
};

function StatusBadge({ status }: { status: EmailStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", cfg.bg, cfg.color, "border", cfg.border)}>
      <Icon className="h-3 w-3" />{cfg.label}
    </span>
  );
}

function EmailList({ emails, status, limit = 15 }: { emails: EmailResult[]; status: EmailStatus; limit?: number }) {
  const [expanded, setExpanded] = useState(false);
  if (emails.length === 0) return null;
  const visible = expanded ? emails : emails.slice(0, limit);
  const cfg = STATUS_CONFIG[status];
  return (
    <div className={cn("rounded-xl border overflow-hidden", cfg.border)}>
      <div className={cn("flex items-center justify-between px-4 py-2.5", cfg.bg)}>
        <span className={cn("text-sm font-semibold", cfg.color)}>
          {cfg.label} ({emails.length})
        </span>
        {emails.length > limit && (
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn("flex items-center gap-1 text-xs font-medium", cfg.color, "hover:opacity-70")}
          >
            {expanded ? <><ChevronUp className="h-3 w-3" /> Show less</> : <><ChevronDown className="h-3 w-3" /> Show all</>}
          </button>
        )}
      </div>
      <div className="divide-y divide-slate-100 bg-white">
        {visible.map((r) => (
          <div key={r.email} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-700">{r.email}</span>
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden text-xs text-slate-400 sm:block">{r.reason}</span>
              <span className={cn(
                "w-10 rounded-full py-0.5 text-center text-xs font-bold tabular-nums",
                r.score >= 90 ? "bg-emerald-100 text-emerald-700" :
                r.score >= 70 ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-600"
              )}>{r.score}</span>
            </div>
          </div>
        ))}
        {!expanded && emails.length > limit && (
          <div className="px-4 py-2.5 text-xs text-slate-400">
            +{emails.length - limit} more…
          </div>
        )}
      </div>
    </div>
  );
}

export default function ResultsCards({ result, isAuthenticated = false }: ResultsCardsProps) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { stats } = result;

  const validPct  = stats.total > 0 ? (stats.valid   / stats.total) * 100 : 0;
  const riskyPct  = stats.total > 0 ? (stats.risky   / stats.total) * 100 : 0;
  const invalidPct = stats.total > 0 ? ((stats.invalid + stats.duplicate) / stats.total) * 100 : 0;

  const deliverRate = getValidRate(stats.valid, stats.total);

  const handleCopy = () => {
    void navigator.clipboard.writeText(result.valid.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const byStatus = (s: EmailStatus) => result.results.filter((r) => r.status === s);

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total",     value: stats.total,                       color: "text-slate-900",   bg: "bg-white",        border: "border-slate-200",   sub: "processed" },
          { label: "Valid",     value: stats.valid,                       color: "text-emerald-600", bg: "bg-emerald-50",   border: "border-emerald-200", sub: "deliverable" },
          { label: "Risky",     value: stats.risky,                       color: "text-amber-600",   bg: "bg-amber-50",     border: "border-amber-200",   sub: "review suggested" },
          { label: "Invalid",   value: stats.invalid + stats.duplicate,   color: "text-red-500",     bg: "bg-red-50",       border: "border-red-200",     sub: "removed" },
        ].map(({ label, value, color, bg, border, sub }) => (
          <div key={label} className={cn("rounded-2xl border p-4 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md sm:p-5", bg, border)}>
            <p className={cn("text-2xl font-extrabold tabular-nums sm:text-3xl", color)}>{value.toLocaleString()}</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{label}</p>
            <p className="text-xs text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Segmented progress bar */}
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="mb-2.5 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">
            {deliverRate}% deliverable rate
          </span>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />Valid</span>
            {stats.risky > 0 && <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-amber-400" />Risky</span>}
            {(stats.invalid + stats.duplicate) > 0 && <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-red-400" />Invalid</span>}
          </div>
        </div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full bg-emerald-400 transition-all duration-700" style={{ width: `${validPct}%` }} />
          <div className="h-full bg-amber-400 transition-all duration-700" style={{ width: `${riskyPct}%` }} />
          <div className="h-full bg-red-400 transition-all duration-700" style={{ width: `${invalidPct}%` }} />
        </div>
        {stats.duplicate > 0 && (
          <p className="mt-2 text-xs text-slate-400">{stats.duplicate} duplicate{stats.duplicate !== 1 ? "s" : ""} removed</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {result.valid.length > 0 && (
          <div className="flex flex-1 gap-2">
            <button
              onClick={() => {
                const csvContent = "Email\n" + result.valid.map(e => `"${e}"`).join("\n");
                downloadCsv("clean_emails.csv", csvContent);
              }}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg"
            >
              <Download className="h-4 w-4" /> CSV ({result.valid.length.toLocaleString()})
            </button>
            <button
              onClick={() => downloadTxt("clean_emails.txt", result.valid.join("\n"))}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 transition-all hover:bg-indigo-100"
            >
              TXT
            </button>
          </div>
        )}
        {result.risky.length > 0 && (
          <button
            onClick={() => downloadTxt("risky_emails.txt", result.risky.join("\n"))}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 transition-all hover:bg-amber-100"
          >
            <Download className="h-4 w-4" /> Risky ({result.risky.length})
          </button>
        )}
        {result.valid.length > 0 && (
          <button
            onClick={handleCopy}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all",
              copied
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-sm"
            )}
          >
            {copied ? <><ClipboardCheck className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy</>}
          </button>
        )}
      </div>

      {/* Details toggle */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition-all hover:bg-slate-50"
      >
        <span>Detailed breakdown</span>
        {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {showDetails && (
        <div className="space-y-3">
          <EmailList emails={byStatus("valid")}     status="valid" />
          <EmailList emails={byStatus("risky")}     status="risky" />
          <EmailList emails={byStatus("invalid")}   status="invalid" />
          <EmailList emails={byStatus("duplicate")} status="duplicate" />
        </div>
      )}

      {/* Unauthenticated upsell */}
      {!isAuthenticated && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-4">
          <p className="text-sm font-semibold text-indigo-900">Want to save your history?</p>
          <p className="mt-1 text-xs text-indigo-600">
            Create a free account to track all your uploads and clean bigger lists.
          </p>
          <Link href="/sign-up" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-800">
            Create free account <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
