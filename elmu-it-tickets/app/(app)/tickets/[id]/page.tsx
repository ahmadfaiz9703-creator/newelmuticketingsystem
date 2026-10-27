import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { STATUSES } from "@/lib/constants";
import { isUuid } from "@/lib/validation";
import { formatDate } from "@/lib/format";
import { PriorityBadge, StatusBadge } from "@/components/Badges";
import { addNote, updateTicket } from "../actions";

type Technician = { id: string; full_name: string | null; email: string };

export default async function TicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string; created?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  if (!isUuid(id)) notFound();

  const { supabase, role } = await requireUser();
  const isAdmin = role === "it_admin";

  // RLS returns nothing if this ticket belongs to someone else, so requesters get a 404.
  const { data: ticket } = await supabase.from("tickets").select("*").eq("id", id).maybeSingle();
  if (!ticket) notFound();

  let technicians: Technician[] = [];
  let notes: { id: string; body: string; created_at: string; author_id: string }[] = [];
  if (isAdmin) {
    const [t, n] = await Promise.all([
      supabase.rpc("list_technicians"),
      supabase.from("ticket_notes").select("id, body, created_at, author_id").eq("ticket_id", id).order("created_at", { ascending: false }),
    ]);
    technicians = (t.data as Technician[] | null) ?? [];
    notes = n.data ?? [];
  }
  const nameOf = (uid: string) => {
    const t = technicians.find((x) => x.id === uid);
    return t ? t.full_name || t.email : "IT admin";
  };

  const rows: [string, React.ReactNode][] = [
    ["Requester", `${ticket.requester_name} (${ticket.requester_email})`],
    ["Department", ticket.department],
    ["Category", ticket.category],
    ["Created", formatDate(ticket.created_at)],
    ["Last updated", formatDate(ticket.updated_at)],
    ["Assigned to", ticket.assigned_to ? (isAdmin ? nameOf(ticket.assigned_to) : "IT team") : "Not assigned yet"],
  ];

  return (
    <div className="space-y-4 max-w-4xl">
      <Link href="/tickets" className="text-sm text-navy-700 hover:underline">Back to tickets</Link>

      {sp.created && <p role="status" className="rounded-md bg-emerald-50 text-emerald-800 text-sm px-3 py-2">Ticket {ticket.ticket_number} submitted. IT will review it soon.</p>}
      {sp.saved && <p role="status" className="rounded-md bg-emerald-50 text-emerald-800 text-sm px-3 py-2">Changes saved.</p>}
      {sp.error && <p role="alert" className="rounded-md bg-red-50 text-red-800 text-sm px-3 py-2">{sp.error}</p>}

      <section className="card p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-navy-900">{ticket.ticket_number}</h1>
          <StatusBadge value={ticket.status} />
          <PriorityBadge value={ticket.priority} />
        </div>
        <p className="mt-1 text-lg">{ticket.subject}</p>
        <dl className="mt-4 grid sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          {rows.map(([k, v]) => (
            <div key={k}><dt className="text-slate-500">{k}</dt><dd className="font-medium break-words">{v}</dd></div>
          ))}
        </dl>
        <h2 className="mt-5 text-sm text-slate-500">Description</h2>
        <p className="mt-1 whitespace-pre-wrap break-words">{ticket.description}</p>
      </section>

      {isAdmin && (
        <>
          <form action={updateTicket} className="card p-5 md:p-6 grid sm:grid-cols-[1fr_1fr_auto] gap-4 items-end">
            <input type="hidden" name="id" value={ticket.id} />
            <div>
              <label className="label" htmlFor="status">Status</label>
              <select className="input" id="status" name="status" defaultValue={ticket.status}>
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="assigned_to">Assigned technician</label>
              <select className="input" id="assigned_to" name="assigned_to" defaultValue={ticket.assigned_to ?? ""}>
                <option value="">Unassigned</option>
                {technicians.map((t) => <option key={t.id} value={t.id}>{t.full_name || t.email}</option>)}
              </select>
            </div>
            <button className="btn-primary">Save changes</button>
          </form>

          <section className="card p-5 md:p-6">
            <h2 className="font-semibold text-navy-900">Internal notes</h2>
            <p className="text-sm text-slate-600">Only IT admins can see these. Requesters cannot.</p>
            <form action={addNote} className="mt-3 space-y-2">
              <input type="hidden" name="id" value={ticket.id} />
              <label className="label" htmlFor="body">Add a resolution note</label>
              <textarea className="input min-h-24" id="body" name="body" maxLength={5000} required />
              <button className="btn-secondary">Add note</button>
            </form>
            {notes.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No notes yet. Record what you tried and how it was fixed.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {notes.map((n) => (
                  <li key={n.id} className="py-3">
                    <p className="text-xs text-slate-500">{nameOf(n.author_id)} on {formatDate(n.created_at)}</p>
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm">{n.body}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
