import { isValidEmailSyntax } from "./regex";
import { deduplicateEmails } from "./duplicates";
import { isRiskyEmail } from "./risky";
import type { ValidationResult } from "@/types";

export interface ValidateOptions {
  removeDuplicates?: boolean;
  flagRisky?: boolean;
}

export function validateEmails(
  rawEmails: string[],
  options: ValidateOptions = {}
): ValidationResult {
  const { removeDuplicates = true, flagRisky = false } = options;

  const trimmed = rawEmails.map((e) => e.trim()).filter(Boolean);

  const { unique, duplicates } = removeDuplicates
    ? deduplicateEmails(trimmed)
    : { unique: trimmed, duplicates: [] };

  const valid: string[] = [];
  const invalid: string[] = [];

  for (const email of unique) {
    const syntaxOk = isValidEmailSyntax(email);
    const risky = flagRisky && isRiskyEmail(email);
    if (syntaxOk && !risky) {
      valid.push(email);
    } else {
      invalid.push(email);
    }
  }

  return {
    valid,
    invalid,
    duplicates,
    total: valid.length + invalid.length,
  };
}

export { isValidEmailSyntax } from "./regex";
export { deduplicateEmails } from "./duplicates";
export { isRiskyEmail } from "./risky";
