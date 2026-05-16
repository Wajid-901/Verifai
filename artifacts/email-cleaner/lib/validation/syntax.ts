const LOCAL_PART_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
const DOMAIN_LABEL_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

export interface SyntaxResult {
  valid: boolean;
  reason?: string;
}

export function checkSyntax(email: string): SyntaxResult {
  if (!email) return { valid: false, reason: "Empty email address" };
  if (email.length > 254) return { valid: false, reason: "Email exceeds max length" };

  const atIdx = email.indexOf("@");
  const lastAt = email.lastIndexOf("@");
  if (atIdx <= 0 || atIdx !== lastAt) return { valid: false, reason: "Invalid @ symbol" };

  const local = email.slice(0, atIdx);
  const domain = email.slice(atIdx + 1);

  if (!local || local.length > 64) return { valid: false, reason: "Invalid local part length" };
  if (!domain) return { valid: false, reason: "Missing domain" };

  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) {
    return { valid: false, reason: "Invalid dots in local part" };
  }

  if (!local.startsWith('"') && !LOCAL_PART_REGEX.test(local)) {
    return { valid: false, reason: "Invalid characters in email" };
  }

  const labels = domain.split(".");
  if (labels.length < 2) return { valid: false, reason: "Domain missing TLD" };

  const tld = labels[labels.length - 1];
  if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return { valid: false, reason: "Invalid top-level domain" };
  }

  for (const label of labels) {
    if (!label || label.length > 63) return { valid: false, reason: "Domain label too long" };
    if (label.startsWith("-") || label.endsWith("-")) {
      return { valid: false, reason: "Domain label starts or ends with hyphen" };
    }
    if (!DOMAIN_LABEL_REGEX.test(label)) {
      return { valid: false, reason: "Invalid domain format" };
    }
  }

  return { valid: true };
}
