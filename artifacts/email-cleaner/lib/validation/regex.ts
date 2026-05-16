const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmailSyntax(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) return false;
  if (trimmed.length > 254) return false;
  const [local, ...domainParts] = trimmed.split("@");
  if (domainParts.length !== 1) return false;
  const domain = domainParts[0];
  if (!local || !domain) return false;
  if (local.length > 64) return false;
  if (!domain.includes(".")) return false;
  return EMAIL_REGEX.test(trimmed);
}
