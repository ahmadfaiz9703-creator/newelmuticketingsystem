import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/constants";

// Verifies the session with Supabase (getUser, not getSession) and loads the role from
// the user_roles table. Called by every protected page and every server action.
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: roleRow }, { data: profile }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);
  const role: Role = roleRow?.role === "it_admin" ? "it_admin" : "requester";
  const name: string = profile?.full_name || user.email || "User";
  return { supabase, user, role, name };
});
