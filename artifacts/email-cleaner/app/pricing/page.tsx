import Link from "next/link";
import {
  Check, X, Crown, Mail, Zap, ArrowRight,
  ShieldCheck, Download, Infinity,
} from "lucide-react";
import CheckoutButton from "@/components/pricing/CheckoutButton";

const freePlan = {
  name: "Free",
  price: "$0",
  period: "forever",
  description: "Perfect for individuals trying Verifai for the first time.",
  features: [
    { label: "Up to 100 emails per upload",      included: true  },
    { label: "Syntax & duplicate validation",    included: true  },
    { label: "CSV & TXT support",                included: true  },
    { label: "Instant download",                 included: true  },
    { label: "No credit card required",          included: true  },
    { label: "Upload history",                   included: false },
    { label: "Advanced MX record checks",        included: false },
    { label: "Disposable email detection",       included: false },
    { label: "Bulk processing (10k+ emails)",    included: false },
    { label: "Priority processing",              included: false },
    { label: "Email support",                    included: false },
  ],
};

const proPlan = {
  name: "Pro",
  price: "$19",
  period: "/month",
  description: "For teams and marketers who clean lists regularly at scale.",
  features: [
    { label: "Unlimited emails per upload",      included: true  },
    { label: "Advanced syntax validation",       included: true  },
    { label: "CSV & TXT support",                included: true  },
    { label: "Instant download",                 included: true  },
    { label: "No credit card required",          included: false },
    { label: "Upload history (last 365 days)",   included: true  },
    { label: "Advanced MX record checks",        included: true  },
    { label: "Disposable email detection",       included: true  },
    { label: "Bulk processing (10k+ emails)",    included: true  },
    { label: "Priority processing",              included: true  },
    { label: "Email support",                    included: true  },
  ],
};

const comparisonRows = [
  { feature: "Emails per upload",         free: "100",          pro: "Unlimited"   },
  { feature: "Validations per day",       free: "25",           pro: "500"         },
  { feature: "Syntax validation",         free: "Standard",     pro: "Advanced"    },
  { feature: "MX record checks",          free: false,          pro: true          },
  { feature: "Disposable email detection",free: false,          pro: true          },
  { feature: "Upload history",            free: "30 days",      pro: "365 days"    },
  { feature: "Bulk processing",           free: false,          pro: true          },
  { feature: "Priority processing",       free: false,          pro: true          },
  { feature: "File formats",              free: "CSV, TXT",     pro: "CSV, TXT"    },
  { feature: "Email support",             free: false,          pro: true          },
  { feature: "Price",                     free: "$0 / forever", pro: "$19 / month" },
];

const faqs = [
  {
    q: "Can I try before I buy?",
    a: "Yes — the Free plan is available forever, no credit card needed. Validate up to 100 emails per upload instantly.",
  },
  {
    q: "What counts as an email?",
    a: "Every unique address in your uploaded file counts as one email towards your plan limit.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. Cancel at any time from your billing settings — your plan stays active until the end of the billing period.",
  },
  {
    q: "What file formats are supported?",
    a: "We support .csv and .txt files. Emails can be separated by newlines, commas, or semicolons.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Navbar */}
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
            <Link href="/#features" className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900">Features</Link>
            <Link href="/pricing"   className="text-sm font-medium text-indigo-600">Pricing</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/sign-in" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 md:block">Sign in</Link>
            <Link href="/sign-up" className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md">
              Get started <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="px-6 pb-12 pt-20 text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-xs font-semibold text-indigo-700">
            <Zap className="h-3.5 w-3.5" /> Simple, transparent pricing
          </div>
          <h1 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
            Start free.{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Scale when ready.
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-slate-500">
            No hidden fees. No long-term contracts. Upgrade or downgrade at any time.
          </p>
        </section>

        {/* Plan cards */}
        <section className="px-6 pb-16">
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            {/* Free card */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-200 hover:shadow-md">
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{freePlan.name}</p>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-5xl font-extrabold text-slate-900">{freePlan.price}</span>
                  <span className="mb-1.5 text-slate-500">{freePlan.period}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">{freePlan.description}</p>
              </div>
              <ul className="mb-8 flex-1 space-y-3">
                {freePlan.features.map(({ label, included }) => (
                  <li key={label} className="flex items-start gap-3 text-sm">
                    {included
                      ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      : <X    className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />}
                    <span className={included ? "text-slate-700" : "text-slate-400"}>{label}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-white hover:shadow-sm active:scale-[0.98]"
              >
                Get started free
              </Link>
            </div>

            {/* Pro card */}
            <div className="relative flex flex-col rounded-2xl border-2 border-indigo-600 bg-white p-8 shadow-xl shadow-indigo-100 transition-all duration-200 hover:shadow-2xl hover:shadow-indigo-100">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-1.5 text-xs font-bold text-white shadow-md">
                  <Crown className="h-3 w-3" /> Most Popular
                </span>
              </div>
              <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">{proPlan.name}</p>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-5xl font-extrabold text-slate-900">{proPlan.price}</span>
                  <span className="mb-1.5 text-slate-500">{proPlan.period}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">{proPlan.description}</p>
              </div>
              <ul className="mb-8 flex-1 space-y-3">
                {proPlan.features.map(({ label, included }) => (
                  <li key={label} className="flex items-start gap-3 text-sm">
                    {included
                      ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                      : <X    className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />}
                    <span className={included ? "text-slate-700" : "text-slate-400"}>{label}</span>
                  </li>
                ))}
              </ul>
              <CheckoutButton
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg disabled:opacity-60 active:scale-[0.98]"
              >
                Get started <ArrowRight className="h-4 w-4" />
              </CheckoutButton>
              <p className="mt-3 text-center text-xs text-slate-400">
                Cancel anytime · Powered by Stripe
              </p>
            </div>
          </div>
        </section>

        {/* Feature comparison */}
        <section className="bg-white px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-8 text-center text-2xl font-bold text-slate-900">Full feature comparison</h2>
            <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Feature</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-slate-500">Free</th>
                    <th className="px-4 py-4 text-center text-sm font-bold text-indigo-600">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisonRows.map(({ feature, free, pro }) => (
                    <tr key={feature} className="transition-colors hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-800">{feature}</td>
                      <td className="px-4 py-4 text-center">
                        {typeof free === "boolean"
                          ? free ? <Check className="mx-auto h-4 w-4 text-emerald-500" /> : <X className="mx-auto h-4 w-4 text-slate-300" />
                          : <span className="text-slate-600">{free}</span>}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {typeof pro === "boolean"
                          ? pro ? <Check className="mx-auto h-4 w-4 text-indigo-600" /> : <X className="mx-auto h-4 w-4 text-slate-300" />
                          : <span className="font-semibold text-indigo-700">{pro}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Why upgrade */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-10 text-center text-2xl font-bold text-slate-900">Why go Pro?</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { icon: Infinity,   title: "Truly Unlimited",  description: "No email caps, no monthly quotas. Upload lists of any size, as often as you need.", iconBg: "bg-indigo-50",  iconColor: "text-indigo-600",  border: "border-indigo-100"  },
                { icon: ShieldCheck,title: "Deeper Validation", description: "Advanced MX record checks and disposable email detection catch more bad addresses.", iconBg: "bg-emerald-50", iconColor: "text-emerald-600", border: "border-emerald-100" },
                { icon: Download,   title: "Full History",      description: "Keep track of every upload. Revisit past results and download any clean list again.", iconBg: "bg-violet-50",  iconColor: "text-violet-600",  border: "border-violet-100"  },
              ].map(({ icon: Icon, title, description, iconBg, iconColor, border }) => (
                <div key={title} className={`rounded-2xl border bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${border}`}>
                  <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border ${border} ${iconBg}`}>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                  <h3 className="font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white px-6 py-16">
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-10 text-center text-2xl font-bold text-slate-900">Frequently asked questions</h2>
            <div className="space-y-4">
              {faqs.map(({ q, a }) => (
                <div key={q} className="rounded-2xl border border-slate-200 p-6 transition-all hover:border-slate-300 hover:shadow-sm">
                  <p className="font-semibold text-slate-900">{q}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-16">
          <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 px-8 py-14 text-center shadow-2xl shadow-indigo-200">
            <div className="pointer-events-none absolute inset-0 rounded-3xl bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
            <h2 className="text-3xl font-extrabold text-white">Ready to clean your first list?</h2>
            <p className="mt-3 text-indigo-200">No credit card for Free. Upgrade anytime.</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
              <Link href="/sign-up" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-base font-semibold text-indigo-700 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]">
                Create free account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3.5 text-base font-semibold text-white transition-all duration-200 hover:bg-white/10 active:scale-[0.98]">
                Go to dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
              <Mail className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-base font-bold text-slate-900">Veri<span className="text-indigo-600">fai</span></span>
          </div>
          <p className="text-sm text-slate-400">© 2026 Verifai, Inc. All rights reserved.</p>
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
