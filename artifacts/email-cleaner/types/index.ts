export type EmailStatus = "valid" | "risky" | "invalid" | "duplicate";

export interface EmailResult {
  email: string;
  status: EmailStatus;
  reason: string;
  score: number;
}

export interface ValidationStats {
  total: number;
  valid: number;
  risky: number;
  invalid: number;
  duplicate: number;
}

export interface ValidationResult {
  valid: string[];
  risky: string[];
  invalid: string[];
  duplicate: string[];
  results: EmailResult[];
  stats: ValidationStats;
  total: number;
}

export interface UploadRecord {
  id: number;
  user_id: string;
  file_name: string;
  total_emails: number;
  valid_count: number;
  risky_count: number;
  invalid_count: number;
  created_at: string;
}

export interface SubscriptionRecord {
  id: number;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  plan: "free" | "pro";
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export type Plan = "free" | "pro";
export type UploadState = "idle" | "file_loaded" | "loading" | "results" | "error";
export type DashboardTab = "dashboard" | "upload" | "history" | "billing";

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  plan: Plan;
  created_at: string;
}
