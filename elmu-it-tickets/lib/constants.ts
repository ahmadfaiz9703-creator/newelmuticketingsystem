// These lists must match the CHECK constraints in supabase/schema.sql
// (tests/schema.test.ts fails if they drift apart).
export const CATEGORIES = [
  "Hardware", "Software", "Network", "Microsoft 365",
  "Vialing/SKY CMS", "OpenLearning", "Account Access", "Other",
] as const;
export const PRIORITIES = ["Low", "Normal", "High", "Critical"] as const;
export const STATUSES = ["Open", "In Progress", "Pending", "Resolved", "Closed"] as const;

export type Category = (typeof CATEGORIES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Status = (typeof STATUSES)[number];
export type Role = "requester" | "it_admin";

// Change this if your campus is in another time zone.
export const TIME_ZONE = "Asia/Kuala_Lumpur";
