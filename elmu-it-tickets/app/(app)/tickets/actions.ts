"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { STATUSES } from "@/lib/constants";
import { isOneOf, isUuid, validateTicketInput } from "@/lib/validation";

export type FormState = { errors?: Record<string, string>; message?: string; values?: Record<string, string> };

export async function createTicket(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const result = validateTicketInput(raw);
  if (!result.ok) return { errors: result.errors, values: raw };

  // requester_id and requester_email come from the verified session, never from the form.
  const { data, error } = await supabase
    .from("tickets")
    .insert({ ...result.data, requester_id: user.id, requester_email: user.email })
    .select("id")
    .single();
  if (error || !data) return { message: "Could not save your ticket. Please try again.", values: raw };

  revalidatePath("/", "layout");
  redirect(`/tickets/${data.id}?created=1`);
}

// Only IT admins may update. Checked here AND enforced by the database (RLS).
export async function updateTicket(formData: FormData) {
  const { supabase, role } = await requireUser();
  const id = String(formData.get("id"));
  if (!isUuid(id)) redirect("/tickets");
  const fail = (m: string): never => redirect(`/tickets/${id}?error=${encodeURIComponent(m)}`);

  if (role !== "it_admin") fail("Only IT admins can update tickets.");
  const status = String(formData.get("status") ?? "");
  const assigned = String(formData.get("assigned_to") ?? "");
  if (!isOneOf(STATUSES, status)) fail("Choose a valid status.");
  if (assigned && !isUuid(assigned)) fail("Choose a valid technician.");

  const { data, error } = await supabase
    .from("tickets")
    .update({ status, assigned_to: assigned || null })
    .eq("id", id)
    .select("id");
  if (error) fail(error.message);
  if (!data?.length) fail("Update was not permitted.");

  revalidatePath("/", "layout");
  redirect(`/tickets/${id}?saved=1`);
}

export async function addNote(formData: FormData) {
  const { supabase, user, role } = await requireUser();
  const id = String(formData.get("id"));
  if (!isUuid(id)) redirect("/tickets");
  const body = String(formData.get("body") ?? "").trim();
  const fail = (m: string): never => redirect(`/tickets/${id}?error=${encodeURIComponent(m)}`);

  if (role !== "it_admin") fail("Only IT admins can add notes.");
  if (!body || body.length > 5000) fail("Write a note of up to 5000 characters.");

  const { error } = await supabase.from("ticket_notes").insert({ ticket_id: id, author_id: user.id, body });
  if (error) fail("Could not save the note.");

  revalidatePath(`/tickets/${id}`);
  redirect(`/tickets/${id}?saved=1`);
}
