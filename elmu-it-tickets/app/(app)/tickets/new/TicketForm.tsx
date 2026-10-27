"use client";

import { useActionState } from "react";
import { createTicket, type FormState } from "../actions";
import { CATEGORIES, PRIORITIES } from "@/lib/constants";

export default function TicketForm({ defaultName, email }: { defaultName: string; email: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createTicket, {});
  const v = state.values ?? {};
  const err = (k: string) => state.errors?.[k] && <p className="mt-1 text-sm text-red-700">{state.errors[k]}</p>;

  return (
    <form action={action} className="card p-5 md:p-6 space-y-4">
      {state.message && <p role="alert" className="rounded-md bg-red-50 text-red-800 text-sm px-3 py-2">{state.message}</p>}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="requester_name">Your name</label>
          <input className="input" id="requester_name" name="requester_name" defaultValue={v.requester_name ?? defaultName} required />
          {err("requester_name")}
        </div>
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input className="input bg-slate-50" id="email" value={email} readOnly aria-describedby="email-help" />
          <p id="email-help" className="mt-1 text-xs text-slate-500">Taken from your account.</p>
        </div>
        <div>
          <label className="label" htmlFor="department">Department</label>
          <input className="input" id="department" name="department" defaultValue={v.department} placeholder="e.g. Faculty of Business" required />
          {err("department")}
        </div>
        <div>
          <label className="label" htmlFor="category">Category</label>
          <select className="input" id="category" name="category" defaultValue={v.category ?? ""} required>
            <option value="" disabled>Select a category</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          {err("category")}
        </div>
      </div>

      <div>
        <label className="label" htmlFor="subject">Subject</label>
        <input className="input" id="subject" name="subject" defaultValue={v.subject} placeholder="Short summary of the problem" maxLength={120} required />
        {err("subject")}
      </div>
      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea className="input min-h-36" id="description" name="description" defaultValue={v.description} maxLength={5000}
          placeholder="What happened, when did it start, and what have you already tried?" required />
        {err("description")}
      </div>
      <div className="md:w-1/2">
        <label className="label" htmlFor="priority">Priority</label>
        <select className="input" id="priority" name="priority" defaultValue={v.priority ?? "Normal"}>
          {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
        </select>
        {err("priority")}
      </div>

      <button className="btn-primary" disabled={pending}>{pending ? "Submitting…" : "Submit ticket"}</button>
    </form>
  );
}
