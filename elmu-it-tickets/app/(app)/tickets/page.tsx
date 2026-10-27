import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { CATEGORIES, PRIORITIES, STATUSES } from "@/lib/constants";
import { cleanSearch, isOneOf } from "@/lib/validation";
import { formatDate } from "@/lib/format";
import { PriorityBadge, StatusBadge } from "@/components/Badges";

type Params = { [key: string]: string | string[] | undefined };
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function TicketsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const sp = await searchParams;
  const { supabase, role } = await requireUser();
  const isAdmin = role === "it_admin";

  const q = cleanSearch(first(sp.q));
  const status = isOneOf(STATUSES, first(sp.status)) ? first(sp.status)! : "";
  const category = isOneOf(CATEGORIES, first(sp.category)) ? first(sp.category)! : "";
  const priority = isOneOf(PRIORITIES, first(sp.priority)) ? first(sp.priority)! : "";
  const filtered = Boolean(q || status || category || priority);

  // RLS limits requesters to their own rows even though no requester filter is added here.
  let query = supabase
    .from("tickets")
    .select("id, ticket_number, subject, requester_name, category, priority, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (q) query = query.or(`ticket_number.ilike.%${q}%,subject.ilike.%${q}%`);
  if (status) query = query.eq("status", status);
  if (category) query = query.eq("category", category);
  if (priority) query = query.eq("priority", priority);
  const { data, error } = await query;
  const tickets = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold text-navy-900">{isAdmin ? "All tickets" : "My tickets"}</h1>
        <Link href="/tickets/new" className="btn-primary">Submit a ticket</Link>
      </div>

      <form className="card p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] items-end">
        <div>
          <label className="label" htmlFor="q">Search</label>
          <input className="input" id="q" name="q" defaultValue={q} placeholder="Ticket number or subject" />
        </div>
        {[
          { name: "status", label: "Status", list: STATUSES, value: status },
          { name: "category", label: "Category", list: CATEGORIES, value: category },
          { name: "priority", label: "Priority", list: PRIORITIES, value: priority },
        ].map((f) => (
          <div key={f.name}>
            <label className="label" htmlFor={f.name}>{f.label}</label>
            <select className="input" id={f.name} name={f.name} defaultValue={f.value}>
              <option value="">All</option>
              {f.list.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div className="flex gap-2">
          <button className="btn-primary">Apply</button>
          {filtered && <Link href="/tickets" className="btn-secondary">Clear</Link>}
        </div>
      </form>

      {error && <p role="alert" className="rounded-md bg-red-50 text-red-800 text-sm px-3 py-2">Could not load tickets. Refresh the page to try again.</p>}

      <div className="card overflow-x-auto">
        {tickets.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="font-medium">{filtered ? "No tickets match these filters" : "No tickets yet"}</p>
            <p className="mt-1 text-sm text-slate-600">
              {filtered ? "Try a different search or clear the filters." : isAdmin ? "Requests will appear here as soon as someone submits one." : "Submit a ticket when you need help from IT."}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Ticket</th><th className="th">Subject</th>
                {isAdmin && <th className="th">Requester</th>}
                <th className="th">Category</th><th className="th">Priority</th><th className="th">Status</th><th className="th">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="td whitespace-nowrap"><Link href={`/tickets/${t.id}`} className="font-medium text-navy-700 hover:underline">{t.ticket_number}</Link></td>
                  <td className="td min-w-56">{t.subject}</td>
                  {isAdmin && <td className="td whitespace-nowrap">{t.requester_name}</td>}
                  <td className="td whitespace-nowrap">{t.category}</td>
                  <td className="td"><PriorityBadge value={t.priority} /></td>
                  <td className="td"><StatusBadge value={t.status} /></td>
                  <td className="td whitespace-nowrap text-slate-500">{formatDate(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {tickets.length === 100 && <p className="text-sm text-slate-500">Showing the 100 newest matches. Use search or filters to narrow the list.</p>}
    </div>
  );
}
