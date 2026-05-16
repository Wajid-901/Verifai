const RISKY_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "throwam.com",
  "trashmail.com",
  "trashmail.me",
  "trashmail.net",
  "yopmail.com",
  "yopmail.fr",
  "sharklasers.com",
  "guerrillamailblock.com",
  "grr.la",
  "spam4.me",
  "tempmail.com",
  "temp-mail.org",
  "10minutemail.com",
  "10minutemail.net",
  "fakeinbox.com",
  "maildrop.cc",
  "dispostable.com",
  "mailnull.com",
  "spamgourmet.com",
  "spamgourmet.net",
  "getairmail.com",
  "filzmail.com",
  "sharklasers.com",
  "guerrillamail.biz",
  "throwam.com",
  "spamex.com",
]);

export function isRiskyEmail(email: string): boolean {
  const parts = email.toLowerCase().split("@");
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return RISKY_DOMAINS.has(domain);
}

export function getRiskyDomains(): Set<string> {
  return RISKY_DOMAINS;
}
