"use client";

import {
  Copy,
  ClipboardCheck,
  Download,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn, downloadTxt, getValidRate } from "@/lib/utils";
import type { ValidationResult } from "@/types";

interface ResultsCardsProps {
  result: ValidationResult;
  isAuthenticated?: boolean;
}

export default function ResultsCards({
  result,
  isAuthenticated = false,
}: ResultsCardsProps) {
  const [copied, setCopied] = useState(false);
  const validPercent = getValidRate(result.valid.length, result.total);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.valid.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          {
            label: "Total",
            value: result.total,
            color: "text-slate-900",
            bg: "bg-white",
            border: "border-slate-200",
            sub: "emails processed",
          },
          {
            label: "Valid",
            value: result.valid.length,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            border: "border-emerald-200",
            sub: "deliverable",
          },
          {
            label: "Invalid",
            value: result.invalid.length,
            color: "text-red-500",
            bg: "bg-red-50",
            border: "border-red-200",
            sub: "removed",
          },
        ].map(({ label, value, color, bg, border, sub }) => (
          <div
            key={label}
            className={cn(
              "rounded-2xl border p-4 shadow-sm transition-all duration-200 hover:scale-[1.03] hover:shadow-md sm:p-5",
              bg,
              border
            )}
          >
            <p className={cn("text-2xl font-extrabold tabular-nums sm:text-3xl", color)}>
              {value}
            </p>
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
        {result.duplicates.length > 0 && (
          <p className="mt-2 text-xs text-slate-400">
            {result.duplicates.length} duplicate{result.duplicates.length !== 1 ? "s" : ""} removed
          </p>
        )}
      </div>

      {/* Actions */}
      {result.valid.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => downloadTxt("clean_emails.txt", result.valid.join("\n"))}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg"
          >
            <Download className="h-4 w-4" /> Download clean list
          </button>
          <button
            onClick={handleCopy}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all",
              copied
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:shadow-sm"
            )}
          >
            {copied ? (
              <><ClipboardCheck className="h-4 w-4" /> Copied!</>
            ) : (
              <><Copy className="h-4 w-4" /> Copy</>
            )}
          </button>
        </div>
      )}

      {/* Unauthenticated upsell */}
      {!isAuthenticated && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-5 py-4">
          <p className="text-sm font-semibold text-indigo-900">
            Want to save your history?
          </p>
          <p className="mt-1 text-xs text-indigo-600">
            Create a free account to track all your uploads and clean bigger lists.
          </p>
          <Link
            href="/sign-up"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-800"
          >
            Create free account <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
}
