"use client";

import { useState, useEffect } from "react";
import {
  Crown, Zap, CreditCard, Calendar, TrendingUp,
  ArrowRight, Loader2, CheckCircle2, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Plan, SubscriptionRecord } from "@/types";

interface BillingData {
  subscription: SubscriptionRecord | null;
  plan: Plan;
  hasStripeCustomer: boolean;
  usage: { todayValidations: number; monthEmails: number };
}

const PRO_FEATURES = [
  "Unlimited emails per upload (free: 100)",
  "500 validations per day (free: 25)",
  "365-day upload history (free: 30 days)",
  "Priority processing queue",
  "Full risky & disposable detection",
  "Advanced MX record checks",
  "Cancel anytime — no lock-in",
];

export default function BillingTab() {
  const [data,      setData]      = useState<BillingData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [managing,  setManaging]  = useState(false);

  useEffect(() => {
    fetch("/api/stripe/subscription")
      .then((r) => r.json() as Promise<BillingData & { error?: string }>)
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load billing data. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async () => {
    setError(null);
    setUpgrading(true);
    try {
      const res  = await fetch("/api/stripe/checkout", { method: "POST" });
      const body = await res.json() as { url?: string; error?: string };
      if (body.url) { window.location.href = body.url; return; }
      setError(body.error ?? "Failed to start checkout. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setUpgrading(false);
    }
  };

  const handleManage = async () => {
    setError(null);
    setManaging(true);
    try {
      const res  = await fetch("/api/stripe/portal", { method: "POST" });
      const body = await res.json() as { url?: string; error?: string };
      if (body.url) { window.location.href = body.url; return; }
      setError(body.error ?? "Failed to open billing portal.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setManaging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  const plan    = data?.plan ?? "free";
  const isPro   = plan === "pro";
  const subData = data?.subscription;

  const renewalDate = subData?.current_period_end
    ? new Date(subData.current_period_end).toLocaleDateString("en-US", {
        month: "long", day: "numeric", year: "numeric",
      })
    : null;

  const dailyLimit = isPro ? 500 : 25;
  const todayUsed  = data?.usage.todayValidations ?? 0;
  const usagePct   = Math.min(Math.round((todayUsed / dailyLimit) * 100), 100);
  const barColor   = usagePct >= 90 ? "bg-red-400" : usagePct >= 70 ? "bg-amber-400" : "bg-indigo-400";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
        <p className="mt-1 text-slate-500">Manage your plan and payment settings</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Current Plan ───────────────────────────────────────────── */}
      <div className={cn(
        "relative overflow-hidden rounded-2xl border p-6 shadow-sm",
        isPro
          ? "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50"
          : "border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50"
      )}>
        {/* Glow */}
        <div
          className="pointer-events-none absolute right-0 top-0 h-48 w-48 translate-x-16 -translate-y-16 rounded-full blur-3xl"
          style={{ background: isPro ? "#fbbf24" : "#818cf8", opacity: 0.18 }}
        />

        <div className="relative">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                {isPro
                  ? <Crown className="h-4 w-4 text-amber-500" />
                  : <Zap className="h-4 w-4 text-indigo-500" />}
                <span className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  isPro ? "text-amber-700" : "text-indigo-700"
                )}>
                  {isPro ? "Pro Plan" : "Free Plan"}
                </span>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-extrabold text-slate-900">
                  {isPro ? "$19" : "$0"}
                </span>
                <span className="mb-1 text-slate-500">{isPro ? "/month" : " forever"}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {isPro
                  ? "Unlimited uploads · Priority processing · Full history"
                  : "100 emails/upload · 25 validations/day"}
              </p>
            </div>
            <span className={cn(
              "shrink-0 rounded-full px-3 py-1 text-xs font-bold",
              isPro ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"
            )}>
              {isPro ? (subData?.status === "active" ? "ACTIVE" : (subData?.status?.toUpperCase() ?? "ACTIVE")) : "FREE"}
            </span>
          </div>

          {renewalDate && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="h-4 w-4" />
              <span>Renews {renewalDate}</span>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            {isPro ? (
              <button
                onClick={handleManage}
                disabled={managing}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-5 py-2.5 text-sm font-semibold text-amber-700 shadow-sm transition-all hover:shadow-md disabled:opacity-50"
              >
                {managing
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <CreditCard className="h-4 w-4" />}
                Manage subscription
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg disabled:opacity-50"
              >
                {upgrading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Crown className="h-4 w-4" />}
                Upgrade to Pro — $19/mo
                {!upgrading && <ArrowRight className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Usage ──────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <TrendingUp className="h-4 w-4 text-slate-400" />
              Validations today
            </div>
            <span className="text-xs tabular-nums text-slate-400">
              {todayUsed} / {dailyLimit}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn("h-full rounded-full transition-all duration-500", barColor)}
              style={{ width: `${usagePct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {dailyLimit - todayUsed > 0
              ? `${dailyLimit - todayUsed} remaining today`
              : "Daily limit reached"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Emails this month
          </div>
          <p className="text-3xl font-extrabold tabular-nums text-slate-900">
            {(data?.usage.monthEmails ?? 0).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-400">Total emails processed</p>
        </div>
      </div>

      {/* ── Pro upsell (free users only) ───────────────────────────── */}
      {!isPro && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-bold text-slate-900">What you get with Pro</h3>
          <div className="space-y-2.5">
            {PRO_FEATURES.map((f) => (
              <div key={f} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
                <span className="text-sm text-slate-700">{f}</span>
              </div>
            ))}
          </div>
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700 disabled:opacity-50"
          >
            {upgrading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
            Upgrade to Pro — $19/month
          </button>
          <p className="mt-2.5 text-center text-xs text-slate-400">
            No lock-in. Cancel anytime from the billing portal.
          </p>
        </div>
      )}
    </div>
  );
}
