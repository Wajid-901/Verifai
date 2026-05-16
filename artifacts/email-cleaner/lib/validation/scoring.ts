import type { EmailStatus } from "@/types";

export interface ScoreInput {
  syntaxOk: boolean;
  domainOk: boolean;
  hasMX: boolean;
  mxTimedOut: boolean;
  isDisposable: boolean;
  isRoleBased: boolean;
}

export interface ScoreResult {
  score: number;
  status: EmailStatus;
}

export function computeScore(input: ScoreInput): ScoreResult {
  if (!input.syntaxOk) return { score: 0, status: "invalid" };
  if (!input.domainOk) return { score: 10, status: "invalid" };
  if (!input.hasMX) return { score: 30, status: "invalid" };
  if (input.isDisposable && input.isRoleBased) return { score: 60, status: "risky" };
  if (input.isDisposable) return { score: 65, status: "risky" };
  if (input.isRoleBased) return { score: 70, status: "risky" };
  if (input.mxTimedOut) return { score: 85, status: "valid" };
  return { score: 100, status: "valid" };
}
