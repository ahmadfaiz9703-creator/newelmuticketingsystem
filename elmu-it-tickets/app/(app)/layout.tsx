import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { signOut } from "../login/actions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { role, name } = await requireUser();
  const isAdmin = role === "it_admin";
  const link = "rounded px-2 py-1 text-sm text-navy-100 hover:bg-navy-800 hover:text-white";
  return (
    <div className="min-h-screen">
      <header className="bg-navy-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href="/" className="font-semibold tracking-tight">ELMU IT Support</Link>
          <nav className="flex flex-wrap gap-1" aria-label="Main">
            <Link href="/" className={link}>Dashboard</Link>
            <Link href="/tickets" className={link}>{isAdmin ? "All tickets" : "My tickets"}</Link>
            <Link href="/tickets/new" className={link}>New ticket</Link>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-navy-100">
              {name} <span className="ml-1 rounded bg-navy-800 px-1.5 py-0.5 text-xs">{isAdmin ? "IT Admin" : "Requester"}</span>
            </span>
            <form action={signOut}><button className="rounded border border-navy-700 px-2.5 py-1 hover:bg-navy-800">Sign out</button></form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">{children}</main>
    </div>
  );
}
