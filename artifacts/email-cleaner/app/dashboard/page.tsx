"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, TrendingUp, CheckCircle2, Zap, Crown, ArrowRight, Menu } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useUploadHistory } from "@/hooks/useUploadHistory";
import Sidebar from "@/components/layout/Sidebar";
import StatsCard from "@/components/dashboard/StatsCard";
import EmptyState from "@/components/dashboard/EmptyState";
import HistoryTable from "@/components/dashboard/HistoryTable";
import BillingTab from "@/components/dashboard/BillingTab";
import UploadWidget from "@/components/upload/UploadWidget";
import Loader from "@/components/ui/Loader";
import type { UserProfile, DashboardTab, Plan } from "@/types";

const FREE_LIMIT = 100;

function DashboardContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [user,        setUser]        = useState<UserProfile | null>(null);
  const [isLoaded,    setIsLoaded]    = useState(false);
  const [activeTab,   setActiveTab]   = useState<DashboardTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { history, loading: historyLoading, fetchHistory, saveUpload } = useUploadHistory();
  const plan: Plan = user?.plan ?? "free";

  // Handle ?billing=success redirect from Stripe
  useEffect(() => {
    if (searchParams.get("billing") === "success") {
      setActiveTab("billing");
    }
  }, [searchParams]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user: authUser } }) => {
      if (!authUser) { router.replace("/sign-in"); return; }
      const { data: profile } = await supabase
        .from("profiles").select("*").eq("id", authUser.id).single();
      setUser({
        id:         authUser.id,
        email:      authUser.email ?? null,
        full_name:  profile?.full_name ?? authUser.user_metadata?.full_name ?? null,
        avatar_url: profile?.avatar_url ?? authUser.user_metadata?.avatar_url ?? null,
        plan:       profile?.plan ?? "free",
        created_at: authUser.created_at,
      });
      setIsLoaded(true);
    });
  }, [router]);

  useEffect(() => { if (isLoaded) void fetchHistory(); }, [isLoaded, fetchHistory]);

  if (!isLoaded || !user) return <Loader />;

  const totalCleaned = history.reduce((s, r) => s + r.valid_count, 0);
  const totalInvalid = history.reduce((s, r) => s + r.invalid_count, 0);
  const overallRate  = totalCleaned + totalInvalid > 0
    ? Math.round((totalCleaned / (totalCleaned + totalInvalid)) * 100) : 0;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        user={user} plan={plan} activeTab={activeTab}
        historyCount={history.length} onTabChange={setActiveTab}
        open={sidebarOpen} onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 overflow-auto lg:ml-64">
        {/* Mobile topbar */}
        <div className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-slate-800 capitalize">{activeTab}</span>
        </div>

        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
          {activeTab === "dashboard" && (
            <DashboardHome
              user={user} plan={plan} history={history} historyLoading={historyLoading}
              totalCleaned={totalCleaned} totalUploads={history.length}
              overallRate={overallRate}
              onUploadClick={() => setActiveTab("upload")}
              onHistoryClick={() => setActiveTab("history")}
              onBillingClick={() => setActiveTab("billing")}
            />
          )}
          {activeTab === "upload" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Upload</h1>
                <p className="mt-1 text-slate-500">
                  {plan === "free"
                    ? `Free plan: up to ${FREE_LIMIT} emails per upload`
                    : "Pro plan: unlimited emails per upload"}
                </p>
              </div>
              <UploadWidget
                plan={plan} isAuthenticated compact
                onResultSaved={(result, fileName) => void saveUpload(result, fileName)}
              />
            </div>
          )}
          {activeTab === "history" && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-slate-900">History</h1>
              {historyLoading ? (
                <div className="h-48 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
              ) : history.length === 0 ? (
                <EmptyState onUploadClick={() => setActiveTab("upload")} />
              ) : (
                <HistoryTable records={history} />
              )}
            </div>
          )}
          {activeTab === "billing" && <BillingTab />}
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<Loader />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardHome({
  user, plan, history, historyLoading, totalCleaned, totalUploads,
  overallRate, onUploadClick, onHistoryClick, onBillingClick,
}: {
  user: UserProfile; plan: Plan;
  history: ReturnType<typeof useUploadHistory>["history"];
  historyLoading: boolean;
  totalCleaned: number; totalUploads: number; overallRate: number;
  onUploadClick: () => void; onHistoryClick: () => void; onBillingClick: () => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user.full_name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="mt-1 text-slate-500">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long", month: "long", day: "numeric", year: "numeric",
          })}
        </p>
      </div>

      {historyLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatsCard icon={TrendingUp}   value={totalCleaned.toLocaleString()}         label="Emails cleaned"   iconBg="bg-indigo-50"  iconColor="text-indigo-600" />
          <StatsCard icon={Upload}       value={String(totalUploads)}                  label="Total uploads"    iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          <StatsCard icon={CheckCircle2} value={totalUploads > 0 ? `${overallRate}%` : "—"} label="Avg. valid rate" iconBg="bg-teal-50"    iconColor="text-teal-600" />
          <StatsCard icon={Zap}          value={plan === "free" ? "100" : "∞"}         label="Email limit"      iconBg="bg-violet-50"  iconColor="text-violet-600" border={plan === "pro" ? "border-amber-200" : "border-slate-200"} />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <button onClick={onUploadClick} className="group flex items-center justify-between rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-sm">
              <Upload className="h-5 w-5 text-white" />
            </div>
            <p className="font-bold text-slate-900">Upload New File</p>
            <p className="mt-0.5 text-sm text-slate-500">Clean your next email list</p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-indigo-400 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
        <button onClick={onHistoryClick} className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 shadow-sm">
              <Upload className="h-5 w-5 text-slate-600" />
            </div>
            <p className="font-bold text-slate-900">View History</p>
            <p className="mt-0.5 text-sm text-slate-500">
              {historyLoading ? "Loading…" : history.length > 0
                ? `${history.length} previous upload${history.length !== 1 ? "s" : ""}`
                : "No uploads yet"}
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>

      {!historyLoading && history.length > 0 && (
        <HistoryTable records={history} limit={5} onViewAll={onHistoryClick} showHeader />
      )}
      {!historyLoading && history.length === 0 && (
        <EmptyState onUploadClick={onUploadClick} />
      )}

      {plan === "free" && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-6 text-white shadow-lg">
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 translate-x-8 -translate-y-8 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">Pro Plan</span>
              </div>
              <h3 className="text-lg font-bold">Unlock unlimited email validation</h3>
              <p className="mt-1 text-sm text-indigo-200">Process any size list, advanced MX checks, priority speed.</p>
            </div>
            <button
              onClick={onBillingClick}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Upgrade to Pro <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
