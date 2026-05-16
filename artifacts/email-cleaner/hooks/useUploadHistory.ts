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
      if (res.ok) {
        const data = (await res.json()) as UploadRecord[];
        setHistory(data);
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const saveUpload = useCallback(
    async (result: ValidationResult, fileName: string) => {
      try {
        await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_name: fileName,
            total_emails: result.total,
            valid_count: result.valid.length,
            invalid_count: result.invalid.length,
          }),
        });
        await fetchHistory();
      } catch {
        // silently ignore — result already shown to user
      }
    },
    [fetchHistory]
  );

  return { history, loading, fetchHistory, saveUpload };
}
