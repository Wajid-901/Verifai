import {
  Zap,
  ShieldCheck,
  Download,
  Star,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Fast Processing",
    description:
      "Validate thousands of emails in seconds with our high-performance engine.",
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-100",
  },
  {
    icon: ShieldCheck,
    title: "Accurate Validation",
    description:
      "Syntax checks, domain verification, and disposable email detection — all built in.",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  {
    icon: Download,
    title: "Clean Export",
    description:
      "Download a pristine, deduplicated list ready for your next campaign.",
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
];

const stats = [
  { value: "99.8%", label: "Accuracy rate" },
  { value: "< 2s", label: "Average processing" },
  { value: "10M+", label: "Emails cleaned" },
  { value: "50K+", label: "Happy users" },
];

const testimonials = [
  {
    name: "Sarah K.",
    role: "Email Marketing Lead",
    text: "Our bounce rate dropped by 78% after switching to Email Cleaner. Game changer.",
    stars: 5,
  },
  {
    name: "Marcus L.",
    role: "Growth Engineer",
    text: "Fastest validation tool I've ever used. Upload, clean, download — done in seconds.",
    stars: 5,
  },
  {
    name: "Priya R.",
    role: "Head of CRM",
    text: "The accuracy is unreal. Caught thousands of invalid emails our old tool missed.",
    stars: 5,
  },
];

export default function FeaturesSection() {
  return (
    <>
      {/* Stats */}
      <section className="border-y border-slate-100 bg-white px-6 py-10">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-extrabold text-slate-900">{value}</p>
              <p className="mt-1 text-sm text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-slate-900">
            Everything you need to keep lists clean
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description, color, bg, border }) => (
              <div
                key={title}
                className={`rounded-2xl border bg-white p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${border}`}
              >
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border ${border} ${bg}`}
                >
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <h3 className="font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-slate-900">
            Trusted by marketers worldwide
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map(({ name, role, text, stars }) => (
              <div
                key={name}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-3 flex gap-0.5">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-slate-600">
                  &ldquo;{text}&rdquo;
                </p>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-slate-900">{name}</p>
                  <p className="text-xs text-slate-400">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
