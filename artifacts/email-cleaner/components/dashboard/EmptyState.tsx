import { Upload } from "lucide-react";

interface EmptyStateProps {
  onUploadClick: () => void;
}

export default function EmptyState({ onUploadClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
        <Upload className="h-7 w-7 text-indigo-400" />
      </div>
      <div>
        <p className="font-semibold text-slate-700">No uploads yet</p>
        <p className="mt-1 text-sm text-slate-400">
          Upload your first email list to see stats here
        </p>
      </div>
      <button
        onClick={onUploadClick}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-md"
      >
        <Upload className="h-4 w-4" /> Upload your first list
      </button>
    </div>
  );
}
