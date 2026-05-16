import type { Plan } from "@/types";

export interface PlanConfig {
  maxEmailsPerUpload: number;
  dailyValidations: number;
  hourlyValidations: number | null;
  mxChecks: boolean;
  riskyDetection: boolean;
  priorityProcessing: boolean;
  historyRetentionDays: number;
}

export const PLAN_CONFIG: Record<Plan | "anonymous", PlanConfig> = {
  anonymous: {
    maxEmailsPerUpload:   100,
    dailyValidations:     0,
    hourlyValidations:    5,
    mxChecks:             true,
    riskyDetection:       false,
    priorityProcessing:   false,
    historyRetentionDays: 0,
  },
  free: {
    maxEmailsPerUpload:   100,
    dailyValidations:     25,
    hourlyValidations:    null,
    mxChecks:             true,
    riskyDetection:       true,
    priorityProcessing:   false,
    historyRetentionDays: 30,
  },
  pro: {
    maxEmailsPerUpload:   100_000,
    dailyValidations:     500,
    hourlyValidations:    null,
    mxChecks:             true,
    riskyDetection:       true,
    priorityProcessing:   true,
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
