import { requireUser } from "@/lib/auth";
import TicketForm from "./TicketForm";

export default async function NewTicketPage() {
  const { user, name } = await requireUser();
  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy-900">Submit a ticket</h1>
        <p className="text-sm text-slate-600">The IT team will review it and update the status. A ticket number is created when you submit.</p>
      </div>
      <TicketForm defaultName={name === user.email ? "" : name} email={user.email ?? ""} />
    </div>
  );
}
