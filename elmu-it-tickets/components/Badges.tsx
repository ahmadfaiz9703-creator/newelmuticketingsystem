const STATUS: Record<string, string> = {
  Open: "bg-blue-100 text-blue-800",
  "In Progress": "bg-amber-100 text-amber-800",
  Pending: "bg-violet-100 text-violet-800",
  Resolved: "bg-emerald-100 text-emerald-800",
  Closed: "bg-slate-200 text-slate-700",
};
const PRIORITY: Record<string, string> = {
  Low: "bg-slate-100 text-slate-700",
  Normal: "bg-sky-100 text-sky-800",
  High: "bg-orange-100 text-orange-800",
  Critical: "bg-red-100 text-red-800",
};
const pill = "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap";

export const StatusBadge = ({ value }: { value: string }) => (
  <span className={`${pill} ${STATUS[value] ?? "bg-slate-100"}`}>{value}</span>
);
export const PriorityBadge = ({ value }: { value: string }) => (
  <span className={`${pill} ${PRIORITY[value] ?? "bg-slate-100"}`}>{value}</span>
);
