export interface UploadRecord {
  id: number;
  user_id: string;
  file_name: string;
  total_emails: number;
  valid_count: number;
  invalid_count: number;
  created_at: string;
}

export interface ValidationResult {
  valid: string[];
  invalid: string[];
  duplicates: string[];
  total: number;
}

export type Plan = "free" | "pro";

export type UploadState = "idle" | "file_loaded" | "loading" | "results" | "error";

export type DashboardTab = "dashboard" | "upload" | "history";

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  plan: Plan;
  created_at: string;
}
