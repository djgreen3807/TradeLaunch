/**
 * Shared domain types used across the admin panel and its gated data endpoints.
 * These mirror the shapes returned by the old inline `createServerFn` handlers in
 * admin.tsx, now returned by the plain-fetch `/api/admin-*` endpoints instead.
 */

export type JobPosting = {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  trade: string;
  description: string;
  location: string | null;
  budget: string | null;
  created_at: string;
};

export type ApprenticeApplication = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  trade: string;
  experience: string | null;
  certifications: string | null;
  location: string | null;
  personal_statement: string | null;
  status: string;
  created_at: string;
};

export type Match = {
  id: string;
  job_posting_id: string;
  application_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  company_name: string;
  job_trade: string;
  full_name: string;
  app_trade: string;
};

export type School = {
  id: string;
  name: string;
  slug: string | null;
  status: string; // pending | approved | rejected | suspended
  city: string | null;
  state: string | null;
  contact_name: string;
  contact_email: string;
  trades: string | null;
  student_count_estimate: number | null;
  message: string | null;
  referral_code: string | null;
  created_at: string | null;
};
