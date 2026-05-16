import { cn } from "@/lib/utils";
import type { ElementType } from "react";

interface StatsCardProps {
  icon: ElementType;
  value: string;
  label: string;
  iconBg: string;
  iconColor: string;
  border?: string;
}

export default function StatsCard({
  icon: Icon,
  value,
  label,
  iconBg,
  iconColor,
  border = "border-slate-200",
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md",
        border
      )}
    >
      <div className={cn("mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl", iconBg)}>
        <Icon className={cn("h-4 w-4", iconColor)} />
      </div>
      <p className="text-2xl font-extrabold tabular-nums text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  );
}
