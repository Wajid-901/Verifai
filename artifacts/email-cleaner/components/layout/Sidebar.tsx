"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  LayoutDashboard,
  Upload,
  History,
  CreditCard,
  Crown,
  Zap,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { UserProfile, DashboardTab, Plan } from "@/types";

interface SidebarProps {
  user: UserProfile;
  plan: Plan;
  activeTab: DashboardTab;
  historyCount: number;
  onTabChange: (tab: DashboardTab) => void;
  open: boolean;
  onClose: () => void;
}

const FREE_LIMIT = 100;

export default function Sidebar({
  user,
  plan,
  activeTab,
  historyCount,
  onTabChange,
  open,
  onClose,
}: SidebarProps) {
  const router   = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const navItems: { id: DashboardTab; icon: React.ElementType; label: string }[] = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "upload",    icon: Upload,          label: "Upload"    },
    { id: "history",   icon: History,         label: "History"   },
    { id: "billing",   icon: CreditCard,      label: "Billing"   },
  ];

  const userInitial = user.full_name?.[0] ?? user.email?.[0]?.toUpperCase() ?? "U";
  const userName    = user.full_name ?? user.email ?? "there";

  const sidebar = (
    <aside className="flex h-full w-64 flex-col border-r border-slate-200 bg-white">
      <Link
        href="/"
        className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-5 transition-opacity hover:opacity-80"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <Mail className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-bold text-slate-900">
          Veri<span className="text-indigo-600">fai</span>
        </span>
        <button
          onClick={onClose}
          className="ml-auto text-slate-400 hover:text-slate-600 lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </Link>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => { onTabChange(id); onClose(); }}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
              activeTab === id
                ? "bg-indigo-50 text-indigo-700 shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
            {id === "history" && historyCount > 0 && (
              <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {historyCount}
              </span>
            )}
            {id === "billing" && plan === "pro" && (
              <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
                PRO
              </span>
            )}
          </button>
        ))}
      </nav>

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
            <button
              onClick={() => { onTabChange("billing"); onClose(); }}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-indigo-700 hover:shadow-sm"
            >
              <Crown className="h-3 w-3" />
              Upgrade to Pro
            </button>
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

      <div className="border-t border-slate-100 p-4">
        <div className="mb-3 flex items-center gap-3">
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar_url}
              alt={userName}
              className="h-8 w-8 rounded-full object-cover ring-2 ring-slate-100"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
              {userInitial}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{userName}</p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-64">
        {sidebar}
      </div>
      {open && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="relative z-50 flex w-64 flex-col">{sidebar}</div>
        </div>
      )}
    </>
  );
}
