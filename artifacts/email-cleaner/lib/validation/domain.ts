const RESERVED_TLDS = new Set(["test", "example", "invalid", "localhost", "local", "lan", "internal"]);
const EXAMPLE_DOMAINS = new Set([
  "example.com","example.org","example.net","example.io",
  "test.com","test.net","test.org","sample.com","domain.com",
  "email.com","placeholder.com","fake.com","noemail.com",
  "nodomain.com","notareal.com","notreal.com","none.com",
]);

export interface DomainResult {
  valid: boolean;
  reason?: string;
}

export function checkDomain(domain: string): DomainResult {
  if (!domain || domain.length > 253) return { valid: false, reason: "Invalid domain" };

  const lower = domain.toLowerCase();

  const labels = lower.split(".");
  const tld = labels[labels.length - 1];

  if (RESERVED_TLDS.has(tld) || RESERVED_TLDS.has(lower)) {
    return { valid: false, reason: "Test or reserved domain" };
  }

  if (EXAMPLE_DOMAINS.has(lower)) {
    return { valid: false, reason: "Example or placeholder domain" };
  }

  if (lower.includes("..") || lower.startsWith(".") || lower.endsWith(".")) {
    return { valid: false, reason: "Malformed domain" };
  }

  return { valid: true };
}
