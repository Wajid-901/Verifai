"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  PartyPopper,
  RefreshCw,
  ArrowRight,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { cn, extractEmails } from "@/lib/utils";
import ResultsCards from "./ResultsCards";
import type { ValidationResult, UploadState, Plan } from "@/types";

const FREE_LIMIT = 100;

interface UploadWidgetProps {
  plan?: Plan;
  isAuthenticated?: boolean;
  onResultSaved?: (result: ValidationResult, fileName: string) => void;
  compact?: boolean;
}

export default function UploadWidget({
  plan = "free",
  isAuthenticated = false,
  onResultSaved,
  compact = false,
}: UploadWidgetProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [emailCount, setEmailCount] = useState(0);
  const [emails, setEmails] = useState<string[]>([]);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingDot, setLoadingDot] = useState(0);

  const fileRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const dotTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startDots = () => {
    dotTimerRef.current = setInterval(
      () => setLoadingDot((d) => (d + 1) % 4),
      400
    );
  };
  const stopDots = () => {
    if (dotTimerRef.current) {
      clearInterval(dotTimerRef.current);
      dotTimerRef.current = null;
    }
  };

  const dots = ".".repeat(loadingDot + 1).padEnd(3, "\u00a0");

  const processFile = useCallback(
    (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext !== "csv" && ext !== "txt") {
        setErrorMsg("Invalid file type. Please upload a .csv or .txt file.");
        setState("error");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const extracted = extractEmails(content);
        const limit = plan === "pro" ? Infinity : FREE_LIMIT;
        if (extracted.length > limit) {
          setErrorMsg(
            isAuthenticated
              ? `Free plan is limited to ${FREE_LIMIT} emails per upload. Your file has ${extracted.length}. Upgrade to Pro for unlimited.`
              : `Free trial is limited to ${FREE_LIMIT} emails. Your file has ${extracted.length}. Sign up to get started, or upgrade to Pro for unlimited.`
          );
          setState("error");
          return;
        }
        setFileName(file.name);
        setEmails(extracted);
        setEmailCount(extracted.length);
        setResult(null);
        setErrorMsg(null);
        setState("file_loaded");
      };
      reader.readAsText(file);
    },
    [plan, isAuthenticated]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleValidate = async () => {
    if (!emails.length) return;
    setState("loading");
    setResult(null);
    setErrorMsg(null);
    startDots();
    try {
      const res = await fetch("/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails, plan }),
      });
      if (!res.ok) throw new Error("Server error");
      const data = (await res.json()) as ValidationResult;
      stopDots();
      setResult(data);
      setState("results");
      if (onResultSaved) onResultSaved(data, fileName ?? "upload.txt");
      setTimeout(
        () => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        100
      );
    } catch {
      stopDots();
      setErrorMsg("Something went wrong. Please try again.");
      setState("error");
    }
  };

  const handleReset = () => {
    setState("idle");
    setFileName(null);
    setEmailCount(0);
    setEmails([]);
    setResult(null);
    setErrorMsg(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className={cn("space-y-5", compact && "space-y-4")}>
      <div
        className={cn(
          "rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50",
          compact ? "p-6" : "p-8"
        )}
      >
        {/* Card header */}
        {!compact && (
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Try it free</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {state === "results" && result
                  ? `${result.total} emails processed`
                  : `Upload up to ${FREE_LIMIT} emails — no sign-up required`}
              </p>
            </div>
            {state === "results" ? (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
              >
                <RefreshCw className="h-3 w-3" /> New upload
              </button>
            ) : (
              <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Free
              </span>
            )}
          </div>
        )}

        {compact && state === "results" && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">{result?.total} emails processed</p>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50"
            >
              <RefreshCw className="h-3 w-3" /> New upload
            </button>
          </div>
        )}

        {/* Error banner */}
        {state === "error" && errorMsg && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-4 w-4 text-red-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-red-800">Upload failed</p>
              <p className="mt-0.5 text-sm text-red-600">{errorMsg}</p>
              {errorMsg.includes("Sign up") && (
                <Link
                  href="/sign-up"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Create free account <ArrowRight className="h-3 w-3" />
                </Link>
              )}
              {errorMsg.includes("Upgrade") && (
                <Link
                  href="/pricing"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                >
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
        {state === "loading" && (
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
                <p className="text-xs text-indigo-500">
                  Checking syntax, domains &amp; duplicates
                </p>
              </div>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-indigo-100">
              <div className="h-full animate-[loading_1.5s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-indigo-400 to-violet-500" />
            </div>
          </div>
        )}

        {/* Success banner */}
        {state === "results" && result && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <PartyPopper className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Your email list is ready!
              </p>
              <p className="text-xs text-emerald-600">
                {result.valid.length} clean emails ready to download
              </p>
            </div>
          </div>
        )}

        {/* Drop zone */}
        {state !== "results" && (
          <button
            type="button"
            onClick={() => state !== "loading" && fileRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              if (state !== "loading") setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            disabled={state === "loading"}
            className={cn(
              "group flex w-full cursor-pointer flex-col items-center gap-4 rounded-xl border-2 border-dashed px-6 py-10 transition-all duration-200",
              state === "loading" && "cursor-wait opacity-60",
              isDragging
                ? "scale-[1.01] border-indigo-400 bg-indigo-50"
                : state === "file_loaded"
                ? "border-emerald-300 bg-emerald-50"
                : state === "error"
                ? "border-red-200 bg-red-50/30"
                : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50"
            )}
          >
            {(state === "file_loaded" || state === "loading") && fileName ? (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 transition-transform duration-200 group-hover:scale-105">
                  <FileText className="h-7 w-7 text-emerald-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-emerald-700">{fileName}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {emailCount} emails detected
                  </p>
                  {state !== "loading" && (
                    <p className="mt-1 text-xs text-slate-400">Click to replace</p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 transition-transform duration-200 group-hover:scale-110">
                  <Upload className="h-7 w-7 text-indigo-600" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-slate-800">
                    {state === "error"
                      ? "Try another file"
                      : "Upload a file to get started"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Drop here or{" "}
                    <span className="font-medium text-indigo-600">browse to upload</span>
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    .csv or .txt — up to{" "}
                    {plan === "pro" ? "unlimited" : `${FREE_LIMIT}`} emails
                  </p>
                </div>
              </>
            )}
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) processFile(f);
          }}
        />

        {/* Validate button */}
        {(state === "file_loaded" || state === "loading") && (
          <button
            type="button"
            onClick={handleValidate}
            disabled={state === "loading"}
            className={cn(
              "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-semibold text-white shadow-md transition-all duration-200",
              state === "loading"
                ? "cursor-wait bg-indigo-400 shadow-none"
                : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg active:scale-[0.98]"
            )}
          >
            {state === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Cleaning your emails{dots}
              </>
            ) : (
              <>
                Validate Emails <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        )}

        {!compact && (
          <p className="mt-4 text-center text-xs text-slate-400">
            Need more?{" "}
            <Link
              href="/sign-up"
              className="font-medium text-indigo-600 hover:text-indigo-700"
            >
              Create a free account
            </Link>{" "}
            or{" "}
            <a
              href="#pricing"
              className="font-medium text-indigo-600 hover:text-indigo-700"
            >
              see Pro plans
            </a>
          </p>
        )}
      </div>

      {/* Results */}
      {state === "results" && result && (
        <div ref={resultsRef}>
          <ResultsCards result={result} isAuthenticated={isAuthenticated} />
        </div>
      )}
    </div>
  );
}
