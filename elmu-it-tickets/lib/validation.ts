import { CATEGORIES, PRIORITIES, type Category, type Priority } from "./constants.ts";

export type TicketInput = {
  requester_name: string;
  department: string;
  category: Category;
  subject: string;
  description: string;
  priority: Priority;
};

export type TicketValidation =
  | { ok: true; data: TicketInput }
  | { ok: false; errors: Record<string, string> };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

export function isOneOf<T extends string>(list: readonly T[], v: unknown): v is T {
  return typeof v === "string" && (list as readonly string[]).includes(v);
}

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function validateTicketInput(raw: Record<string, unknown>): TicketValidation {
  const errors: Record<string, string> = {};
  const requester_name = text(raw.requester_name);
  const department = text(raw.department);
  const subject = text(raw.subject);
  const description = text(raw.description);

  if (requester_name.length < 2 || requester_name.length > 100) errors.requester_name = "Enter your full name (2–100 characters).";
  if (department.length < 2 || department.length > 100) errors.department = "Enter your department (2–100 characters).";
  if (subject.length < 5 || subject.length > 120) errors.subject = "Subject must be 5–120 characters.";
  if (description.length < 10 || description.length > 5000) errors.description = "Describe the problem in 10–5000 characters.";
  if (!isOneOf(CATEGORIES, raw.category)) errors.category = "Choose a category.";
  if (!isOneOf(PRIORITIES, raw.priority)) errors.priority = "Choose a priority.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    data: {
      requester_name, department, subject, description,
      category: raw.category as Category,
      priority: raw.priority as Priority,
    },
  };
}

// Makes a user's search text safe to place inside a PostgREST .or() filter.
export function cleanSearch(q: unknown): string {
  return typeof q === "string" ? q.replace(/[,()%*_\\:]/g, " ").trim().slice(0, 80) : "";
}
