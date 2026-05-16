export function deduplicateEmails(emails: string[]): {
  unique: string[];
  duplicates: string[];
} {
  const seen = new Set<string>();
  const unique: string[] = [];
  const duplicates: string[] = [];

  for (const email of emails) {
    const normalized = email.trim().toLowerCase();
    if (normalized && seen.has(normalized)) {
      duplicates.push(email.trim());
    } else if (normalized) {
      seen.add(normalized);
      unique.push(email.trim());
    }
  }

  return { unique, duplicates };
}
