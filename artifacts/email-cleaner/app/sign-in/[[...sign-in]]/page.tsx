import { SignIn } from "@clerk/nextjs";
import { Mail } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-white to-indigo-50/40">
      <header className="px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <Mail className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">
            Email<span className="text-indigo-600">Cleaner</span>
          </span>
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-[440px]">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="mt-1 text-slate-500">Sign in to your account</p>
          </div>
          <SignIn
            path="/sign-in"
            routing="path"
            signUpUrl="/sign-up"
            fallbackRedirectUrl="/dashboard"
          />
        </div>
      </div>
    </div>
  );
}
