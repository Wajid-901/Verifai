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



export default function FeaturesSection() {
  return (
    <>


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


    </>
  );
}
