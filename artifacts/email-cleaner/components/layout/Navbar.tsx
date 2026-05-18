import Link from "next/link";
import { Mail, LayoutDashboard, ChevronRight } from "lucide-react";
import type { UserProfile } from "@/types";

interface NavbarProps {
  user?: UserProfile | null;
  activePage?: "home" | "pricing";
}

export default function Navbar({ user, activePage }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <Mail className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">
            Veri<span className="text-indigo-600">fai</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <a
            href="/#features"
            className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
          >
            Features
          </a>
          <Link
            href="/pricing"
            className={
              activePage === "pricing"
                ? "text-sm font-medium text-indigo-600"
                : "text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
            }
          >
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 md:flex">
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar_url}
                    alt={user.full_name ?? "User"}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-slate-200"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                    {user.full_name?.[0] ?? user.email?.[0]?.toUpperCase() ?? "U"}
                  </div>
                )}
                <span className="text-sm font-medium text-slate-700">
                  {user.full_name ?? user.email}
                </span>
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-indigo-700 hover:shadow-md active:scale-[0.98]"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
            </div>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 md:block"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-indigo-700 hover:shadow-md active:scale-[0.98]"
              >
                Get started <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
