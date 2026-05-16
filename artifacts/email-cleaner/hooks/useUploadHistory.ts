"use client";

import { useState, useCallback } from "react";
import type { UploadRecord, ValidationResult } from "@/types";

export function useUploadHistory() {
  const [history, setHistory] = useState<UploadRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/history");
      if (res.ok) setHistory((await res.json()) as UploadRecord[]);
    } catch { /* silently ignore */ }
    finally { setLoading(false); }
  }, []);

  const saveUpload = useCallback(
    async (result: ValidationResult, fileName: string) => {
      try {
        await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_name: fileName,
            total_emails: result.stats.total,
            valid_count: result.stats.valid,
            risky_count: result.stats.risky,
            invalid_count: result.stats.invalid + result.stats.duplicate,
          }),
        });
        await fetchHistory();
      } catch { /* silently ignore — result already shown */ }
    },
    [fetchHistory]
  );

  return { history, loading, fetchHistory, saveUpload };
}
