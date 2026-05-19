"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Crown, Zap, CreditCard, Calendar, TrendingUp,
  ArrowRight, Loader2, CheckCircle2, AlertCircle,
  XCircle, RefreshCw, Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Plan, SubscriptionRecord, BillingEvent, UsageData } from "@/types";

interface UsageResponse {
  plan: Plan;
  usage: UsageData & { resets: string };
  subscription: SubscriptionRecord | null;
  billingEvents: BillingEvent[];
  hasCustomer: boolean;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.Razorpay !== "undefined") { resolve(); return; }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload  = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay script"));
    document.body.appendChild(script);
  });
}

const PRO_FEATURES = [
  "25,000 emails validated per month",
  "Unlimited emails per single upload",
  "Advanced MX record verification",
  "Disposable email detection",
  "Risky email flagging",
  "365-day upload history",
  "Priority processing queue",
  "Cancel anytime, no lock-in",
];

export default function BillingTab() {
  const [data,       setData]       = useState<UsageResponse | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [upgrading,  setUpgrading]  = useState(false);
  const [canceling,  setCanceling]  = useState(false);
  const [cancelDone, setCancelDone] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    fetch("/api/razorpay/usage")
      .then((r) => r.json() as Promise<UsageResponse & { error?: string }>)
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load billing data. Please refresh."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpgrade = async () => {
    setError(null);
    setUpgrading(true);
    try {
      await loadRazorpayScript();

      const res  = await fetch("/api/razorpay/create-subscription", { method: "POST" });
      const body = await res.json() as { subscriptionId?: string; keyId?: string; error?: string };

      if (res.status === 401) { window.location.href = "/sign-in"; return; }
      if (body.error) { setError(body.error); setUpgrading(false); return; }

      const rzp = new window.Razorpay({
        key:             body.keyId,
        subscription_id: body.subscriptionId,
        name:            "Verifai",
        description:     "Pro Plan — 25,000 emails/month",
        theme:           { color: "#4f46e5" },
        handler: async (response: {
          razorpay_payment_id:      string;
          razorpay_subscription_id: string;
          razorpay_signature:       string;
        }) => {
          setUpgrading(true);
          try {
            const verifyRes = await fetch("/api/razorpay/verify", {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify(response),
            });
            const { success, error: verifyErr } = await verifyRes.json() as { success?: boolean; error?: string };
            if (!success) { setError(verifyErr ?? "Verification failed. Contact support."); setUpgrading(false); return; }
            window.location.href = "/dashboard?billing=success";
          } catch {
            setError("Verification failed. Please refresh to check your plan.");
            setUpgrading(false);
          }
        },
        modal: { ondismiss: () => setUpgrading(false) },
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel? You keep Pro access until the end of this billing period.")) return;
    setCanceling(true);
    setError(null);
    try {
      const res  = await fetch("/api/razorpay/cancel", { method: "POST" });
      const body = await res.json() as { success?: boolean; error?: string; message?: string };
      if (body.error) { setError(body.error); return; }
      setCancelDone(true);
      fetchData();
    } catch {
      setError("Failed to cancel. Please try again.");
    } finally {
      setCanceling(false);
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
  const usage   = data?.usage;
  const sub     = data?.subscription;
  const events  = data?.billingEvents ?? [];

  const renewalDate = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  const barColor =
    (usage?.pct ?? 0) >= 90 ? "bg-red-400" :
    (usage?.pct ?? 0) >= 70 ? "bg-amber-400" : "bg-indigo-400";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
        <p className="mt-1 text-slate-500">Manage your plan, usage, and payment history</p>
      </div>

      {/* ── Errors / notices ──────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {cancelDone && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          Cancellation scheduled. You keep Pro access until the end of your billing period.
        </div>
      )}

      {/* ── Plan card ─────────────────────────────────────────── */}
      <div className={cn(
        "relative overflow-hidden rounded-2xl border p-6 shadow-sm",
        isPro
          ? "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50"
          : "border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50"
      )}>
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
                  : <Zap   className="h-4 w-4 text-indigo-500" />}
                <span className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  isPro ? "text-amber-700" : "text-indigo-700"
                )}>
                  {isPro ? "Pro Plan" : "Free Plan"}
                </span>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-extrabold text-slate-900">
                  {isPro ? "₹5" : "₹0"}
                </span>
                <span className="mb-1 text-slate-500">{isPro ? "/month" : " forever"}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">
                {isPro
                  ? "25,000 emails/month · Priority processing · Full history"
                  : "100 emails/day · Basic validation"}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <span className={cn(
                "inline-block rounded-full px-3 py-1 text-xs font-bold",
                isPro ? "bg-amber-100 text-amber-700" : "bg-indigo-100 text-indigo-700"
              )}>
                {isPro
                  ? (sub?.status === "active" ? "ACTIVE" : (sub?.status?.toUpperCase() ?? "ACTIVE"))
                  : "FREE"}
              </span>
              {renewalDate && (
                <div className="mt-2 flex items-center justify-end gap-1.5 text-xs text-slate-500">
                  <Calendar className="h-3 w-3" />
                  Renews {renewalDate}
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {isPro ? (
              <>
                <button
                  onClick={fetchData}
                  className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-amber-700 shadow-sm transition-all hover:shadow-md"
                >
                  <RefreshCw className="h-4 w-4" /> Refresh
                </button>
                {!cancelDone && (
                  <button
                    onClick={handleCancel}
                    disabled={canceling}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm transition-all hover:shadow-md disabled:opacity-50"
                  >
                    {canceling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Cancel subscription
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg disabled:opacity-50"
              >
                {upgrading
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Crown className="h-4 w-4" />}
                Upgrade to Pro
                {!upgrading && <ArrowRight className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Usage bars ────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <TrendingUp className="h-4 w-4 text-slate-400" />
              {isPro ? "Monthly emails" : "Daily emails"}
            </div>
            <span className="tabular-nums text-xs text-slate-400">
              {(usage?.used ?? 0).toLocaleString()} / {(usage?.limit ?? 0).toLocaleString()}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn("h-full rounded-full transition-all duration-500", barColor)}
              style={{ width: `${usage?.pct ?? 0}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>
              {(usage?.remaining ?? 0).toLocaleString()} remaining
            </span>
            <span>Resets {usage?.resets ?? "soon"}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Credits remaining
          </div>
          <p className="text-4xl font-extrabold tabular-nums text-slate-900">
            {(usage?.remaining ?? 0).toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            of {(usage?.limit ?? 0).toLocaleString()} {isPro ? "monthly" : "daily"} credits
          </p>
        </div>
      </div>

      {/* ── Pro upsell (free users only) ──────────────────────── */}
      {!isPro && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 font-bold text-slate-900">What you get with Pro</h3>
          <div className="grid gap-2.5 sm:grid-cols-2">
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
            Upgrade to Pro — ₹5/month
          </button>
          <p className="mt-2.5 text-center text-xs text-slate-400">
            Powered by Razorpay · Cancel anytime · No hidden charges
          </p>
        </div>
      )}

      {/* ── Billing history ───────────────────────────────────── */}
      {events.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
            <Receipt className="h-4 w-4 text-slate-400" />
            <h3 className="font-semibold text-slate-900">Payment history</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {events.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full",
                    ev.status === "success" ? "bg-emerald-50" : "bg-red-50"
                  )}>
                    {ev.status === "success"
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      : <AlertCircle  className="h-4 w-4 text-red-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize text-slate-800">
                      {ev.event_type.replace(".", " ")}
                    </p>
                    {ev.razorpay_payment_id && (
                      <p className="text-xs text-slate-400 font-mono">{ev.razorpay_payment_id}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {ev.amount != null && (
                    <p className="text-sm font-semibold text-slate-900">
                      ₹{(ev.amount / 100).toLocaleString("en-IN")}
                    </p>
                  )}
                  <p className="text-xs text-slate-400">
                    {new Date(ev.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Payment method badge ──────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
        <CreditCard className="h-3.5 w-3.5" />
        Payments secured by Razorpay
      </div>
    </div>
  );
}
