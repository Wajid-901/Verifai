import { checkSyntax } from "./syntax";
import { deduplicateEmails } from "./duplicates";
import { isDisposable, isRoleBased } from "./disposable";
import { checkDomain } from "./domain";
import { checkMXBatch } from "./mx";
import { computeScore } from "./scoring";
import type { ValidationResult, EmailResult } from "@/types";

export interface ValidateOptions {
  removeDuplicates?: boolean;
  checkMXRecords?: boolean;
}

export async function validateEmails(
  rawEmails: string[],
  options: ValidateOptions = {}
): Promise<ValidationResult> {
  const { removeDuplicates = true, checkMXRecords = false } = options;

  const trimmed = rawEmails.map((e) => e.trim()).filter(Boolean);

  // Step 1: Deduplicate
  const { unique, duplicates } = removeDuplicates
    ? deduplicateEmails(trimmed)
    : { unique: trimmed, duplicates: [] };

  // Step 2: Syntax check + collect domains for batch MX lookup
  const syntaxMap = new Map<string, ReturnType<typeof checkSyntax>>();
  const domainSet = new Set<string>();

  for (const email of unique) {
    const syntax = checkSyntax(email);
    syntaxMap.set(email, syntax);
    if (syntax.valid) {
      const domain = email.slice(email.indexOf("@") + 1).toLowerCase();
      domainSet.add(domain);
    }
  }

  // Step 3: Batch MX lookups (parallel, server-side only)
  const mxMap = checkMXRecords
    ? await checkMXBatch(Array.from(domainSet))
    : new Map<string, { hasMX: boolean; timedOut: boolean }>();

  // Steps 4-7: Build per-email results
  const results: EmailResult[] = [];

  for (const email of unique) {
    const syntax = syntaxMap.get(email)!;

    if (!syntax.valid) {
      results.push({ email, status: "invalid", reason: syntax.reason ?? "Invalid format", score: 0 });
      continue;
    }

    const atIdx = email.indexOf("@");
    const local = email.slice(0, atIdx);
    const domain = email.slice(atIdx + 1).toLowerCase();

    const domainCheck = checkDomain(domain);
    if (!domainCheck.valid) {
      results.push({ email, status: "invalid", reason: domainCheck.reason ?? "Invalid domain", score: 10 });
      continue;
    }

    const disposable = isDisposable(domain);
    const roleBased = isRoleBased(local);
    const mx = mxMap.get(domain) ?? { hasMX: true, timedOut: false };

    const { score, status } = computeScore({
      syntaxOk: true,
      domainOk: true,
      hasMX: mx.hasMX,
      mxTimedOut: mx.timedOut,
      isDisposable: disposable,
      isRoleBased: roleBased,
    });

    const reason =
      !mx.hasMX ? "No mail server (MX) found" :
      disposable && roleBased ? "Disposable provider + role-based address" :
      disposable ? "Disposable email provider" :
      roleBased ? "Role-based email address" :
      mx.timedOut ? "MX check timed out (assumed valid)" :
      "Passes all checks";

    results.push({ email, status, reason, score });
  }

  // Add duplicates
  for (const email of duplicates) {
    results.push({ email, status: "duplicate", reason: "Duplicate address", score: 0 });
  }

  const valid = results.filter((r) => r.status === "valid").map((r) => r.email);
  const risky = results.filter((r) => r.status === "risky").map((r) => r.email);
  const invalid = results.filter((r) => r.status === "invalid").map((r) => r.email);
  const duplicate = results.filter((r) => r.status === "duplicate").map((r) => r.email);

  return {
    valid,
    risky,
    invalid,
    duplicate,
    results,
    stats: {
      total: trimmed.length,
      valid: valid.length,
      risky: risky.length,
      invalid: invalid.length,
      duplicate: duplicate.length,
    },
    total: trimmed.length,
  };
}

export { checkSyntax } from "./syntax";
export { deduplicateEmails } from "./duplicates";
export { isDisposable, isRoleBased } from "./disposable";
export { checkDomain } from "./domain";
export { checkMX, checkMXBatch } from "./mx";
export { computeScore } from "./scoring";
