import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { PriorityBadge, StatusBadge } from "@/components/Badges";

export default async function Dashboard() {
  const { supabase, role } = await requireUser();
  const count = (status?: string) => {
    const q = supabase.from("tickets").select("id", { count: "exact", head: true });
    return status ? q.eq("status", status) : q;
  };
  const [total, open, progress, resolved, recent] = await Promise.all([
    count(), count("Open"), count("In Progress"), count("Resolved"),
    supabase.from("tickets").select("id, ticket_number, subject, status, priority, created_at")
      .order("created_at", { ascending: false }).limit(5),
  ]);

  const stats = [
    { label: "Total tickets", n: total.count ?? 0, bar: "border-navy-900" },
    { label: "Open", n: open.count ?? 0, bar: "border-blue-500" },
    { label: "In progress", n: progress.count ?? 0, bar: "border-amber-500" },
    { label: "Resolved", n: resolved.count ?? 0, bar: "border-emerald-500" },
  ];
  const tickets = recent.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-navy-900">Dashboard</h1>
          <p className="text-sm text-slate-600">{role === "it_admin" ? "All tickets across ELMU." : "Your tickets."}</p>
        </div>
        <Link href="/tickets/new" className="btn-primary">Submit a ticket</Link>
      </div>

      <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`card border-l-4 ${s.bar} p-4`}>
            <dt className="text-sm text-slate-600">{s.label}</dt>
            <dd className="mt-1 text-3xl font-semibold text-navy-900">{s.n}</dd>
          </div>
        ))}
      </dl>

      <section className="card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="font-semibold text-navy-900">Recent tickets</h2>
          <Link href="/tickets" className="text-sm text-navy-700 hover:underline">View all</Link>
        </div>
        {tickets.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="font-medium text-slate-800">No tickets yet</p>
            <p className="mt-1 text-sm text-slate-600">
              {role === "it_admin" ? "New requests from staff and students will appear here." : "When you report a problem, you can follow it here."}
            </p>
            <Link href="/tickets/new" className="btn-primary mt-4">Submit the first ticket</Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {tickets.map((t) => (
              <li key={t.id}>
                <Link href={`/tickets/${t.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-slate-50">
                  <span className="text-sm font-medium text-navy-700 w-24">{t.ticket_number}</span>
                  <span className="flex-1 min-w-48 text-sm">{t.subject}</span>
                  <PriorityBadge value={t.priority} />
                  <StatusBadge value={t.status} />
                  <span className="text-xs text-slate-500">{formatDate(t.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
