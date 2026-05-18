import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import { Mail, MessageSquare, Clock } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Support — Verifai",
  description: "Get help with Verifai.",
};

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar activePage={undefined} />
      
      <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
          <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Support
          </h1>
          <p className="mb-10 text-lg text-slate-500">
            We&apos;re currently in public beta. We&apos;d love to hear your feedback or help you with any issues!
          </p>
          
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-bold text-slate-900">Email Us</h3>
              <p className="mb-4 text-sm text-slate-600">
                For bug reports, billing issues, or general feedback, drop us an email.
              </p>
              <a 
                href="mailto:support@verifai.app" 
                className="inline-flex items-center font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                support@verifai.app <span className="ml-2 text-xs text-indigo-400">(placeholder)</span>
              </a>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm border border-slate-200">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-bold text-slate-900">Response Times</h3>
              <p className="text-sm text-slate-600">
                As a beta product, our small team aims to respond to all inquiries within <strong>24-48 hours</strong> during weekdays.
              </p>
            </div>
          </div>

          <div className="mt-12 rounded-2xl border border-slate-200 p-6 sm:p-8">
            <h3 className="font-bold text-slate-900">Common Questions</h3>
            <div className="mt-6 space-y-6">
              <div>
                <h4 className="font-semibold text-slate-800">How do I cancel my Pro subscription?</h4>
                <p className="mt-1 text-sm text-slate-600">You can easily cancel anytime by clicking the &quot;Manage Subscription&quot; button in your dashboard Billing tab.</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">My list failed to upload. Why?</h4>
                <p className="mt-1 text-sm text-slate-600">Ensure your file is in .csv or .txt format, and under the size limits of your plan. Check that your emails are separated correctly.</p>
              </div>
            </div>
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
