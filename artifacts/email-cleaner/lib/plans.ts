import type { Plan } from "@/types";

export interface PlanConfig {
  /** Maximum emails allowed per single upload/request */
  maxEmailsPerUpload: number;
  /** Maximum emails per day (free plan, null = no daily cap) */
  dailyEmailLimit: number | null;
  /** Maximum emails per month (pro plan, null = no monthly cap) */
  monthlyEmailLimit: number | null;
  /** Legacy hourly rate-limit (requests, not emails) */
  hourlyValidations: number | null;
  mxChecks: boolean;
  riskyDetection: boolean;
  priorityProcessing: boolean;
  historyRetentionDays: number;
}

export const PLAN_CONFIG: Record<Plan | "anonymous", PlanConfig> = {
  anonymous: {
    maxEmailsPerUpload:  100,
    dailyEmailLimit:     100,
    monthlyEmailLimit:   null,
    hourlyValidations:   5,
    mxChecks:            true,
    riskyDetection:      false,
    priorityProcessing:  false,
    historyRetentionDays: 0,
  },
  free: {
    maxEmailsPerUpload:  100,
    dailyEmailLimit:     100,
    monthlyEmailLimit:   null,
    hourlyValidations:   null,
    mxChecks:            true,
    riskyDetection:      true,
    priorityProcessing:  false,
    historyRetentionDays: 30,
  },
  pro: {
    maxEmailsPerUpload:  100_000,
    dailyEmailLimit:     null,
    monthlyEmailLimit:   25_000,
    hourlyValidations:   null,
    mxChecks:            true,
    riskyDetection:      true,
    priorityProcessing:  true,
    historyRetentionDays: 365,
  },
};

export function getPlanConfig(plan: Plan | "anonymous"): PlanConfig {
  return PLAN_CONFIG[plan];
}

export function getEmailLimit(plan: Plan | "anonymous"): number {
  return PLAN_CONFIG[plan].maxEmailsPerUpload;
}

export function canUseMX(plan: Plan | "anonymous"): boolean {
  return PLAN_CONFIG[plan].mxChecks;
}

export function canUseRiskyDetection(plan: Plan | "anonymous"): boolean {
  return PLAN_CONFIG[plan].riskyDetection;
}
