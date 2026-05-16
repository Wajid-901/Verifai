import { FileText } from "lucide-react";
import { cn, formatDate, getValidRate } from "@/lib/utils";
import type { UploadRecord } from "@/types";

interface HistoryTableProps {
  records: UploadRecord[];
  limit?: number;
  onViewAll?: () => void;
  showHeader?: boolean;
}

export default function HistoryTable({ records, limit, onViewAll, showHeader = false }: HistoryTableProps) {
  const displayed = limit ? records.slice(0, limit) : records;

  return (
    <div>
      {showHeader && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Recent uploads</h2>
          {onViewAll && (
            <button onClick={onViewAll} className="text-xs font-medium text-indigo-600 hover:text-indigo-700">
              View all →
            </button>
          )}
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">File</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Valid</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Risky</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayed.map((rec) => {
                const rate = getValidRate(rec.valid_count, rec.total_emails);
                return (
                  <tr key={rec.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                        <span className="max-w-[180px] truncate font-medium text-slate-800">{rec.file_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(rec.created_at)}</td>
                    <td className="px-4 py-3 text-center font-semibold text-emerald-600">{rec.valid_count.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      {(rec.risky_count ?? 0) > 0 ? (
                        <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          {rec.risky_count}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        rate >= 80 ? "bg-emerald-100 text-emerald-700" :
                        rate >= 50 ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                      )}>
                        {rate}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
