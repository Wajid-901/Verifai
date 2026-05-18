import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Mail } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — Verifai",
  description: "Terms and conditions for using Verifai.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar activePage={undefined} />
      
      <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
          <h1 className="mb-8 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Terms of Service
          </h1>
          
          <div className="prose prose-slate prose-indigo max-w-none">
            <p className="text-sm text-slate-500">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            
            <h2 className="mt-8 text-xl font-bold text-slate-900">1. Acceptance of Terms</h2>
            <p className="mt-4 text-slate-600">
              By accessing and using Verifai, you accept and agree to be bound by these Terms of Service. 
              If you do not agree, please do not use our service.
            </p>

            <h2 className="mt-8 text-xl font-bold text-slate-900">2. Service Usage</h2>
            <p className="mt-4 text-slate-600">
              Verifai provides email list validation services. You agree to use the service only for lawful purposes 
              and not to upload lists of emails acquired illegally or for spamming purposes.
            </p>

            <h2 className="mt-8 text-xl font-bold text-slate-900">3. Accounts and Billing</h2>
            <p className="mt-4 text-slate-600">
              Free plans have usage limits. Upgrading to a Pro plan requires a valid payment method. 
              Subscriptions are billed on a recurring basis and can be canceled at any time through your dashboard.
            </p>

            <h2 className="mt-8 text-xl font-bold text-slate-900">4. Disclaimer of Warranties</h2>
            <p className="mt-4 text-slate-600">
              We strive to provide highly accurate email validation, but we cannot guarantee 100% accuracy. 
              The service is provided &quot;as is&quot; without any warranties, express or implied.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
              <Mail className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-base font-bold text-slate-900">Veri<span className="text-indigo-600">fai</span></span>
          </div>
          <p className="text-sm text-slate-400">© {new Date().getFullYear()} Verifai, Inc. All rights reserved.</p>
          <div className="flex gap-6">
            {["Privacy", "Terms", "Support"].map((item) => (
              <Link key={item} href={`/${item.toLowerCase()}`} className="text-sm text-slate-500 transition-colors hover:text-slate-900">{item}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
