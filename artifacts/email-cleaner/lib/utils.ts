export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function extractEmails(content: string): string[] {
  return content
    .split(/[\r\n,;]+/)
    .map((l) => l.trim())
    .filter(Boolean);
}

export function downloadTxt(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getValidRate(validCount: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((validCount / total) * 100);
}
