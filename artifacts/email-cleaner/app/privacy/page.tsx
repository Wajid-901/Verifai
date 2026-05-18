import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Mail } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Verifai",
  description: "Privacy policy for Verifai email validation services.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar activePage={undefined} />
      
      <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
          <h1 className="mb-8 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Privacy Policy
          </h1>
          
          <div className="prose prose-slate prose-indigo max-w-none">
            <p className="text-sm text-slate-500">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            
            <h2 className="mt-8 text-xl font-bold text-slate-900">1. Information We Collect</h2>
            <p className="mt-4 text-slate-600">
              When you use Verifai, we collect the email lists you upload solely for the purpose of validating them. 
              We also collect basic account information (like your email address) when you sign up.
            </p>

            <h2 className="mt-8 text-xl font-bold text-slate-900">2. How We Use Your Data</h2>
            <p className="mt-4 text-slate-600">
              Your uploaded email lists are processed to provide our validation service. 
              We do not sell, rent, or share your email lists with any third parties. 
              Your data is yours, and we only process it at your request.
            </p>

            <h2 className="mt-8 text-xl font-bold text-slate-900">3. Data Retention</h2>
            <p className="mt-4 text-slate-600">
              By default, we keep a history of your uploads so you can download past results. 
              You can delete your account and all associated data at any time.
            </p>

            <h2 className="mt-8 text-xl font-bold text-slate-900">4. Third-Party Services</h2>
            <p className="mt-4 text-slate-600">
              We use trusted third-party services (like Supabase for authentication and Stripe for payment processing). 
              These services only receive the minimum data necessary to function securely.
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
