"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const back = (kind: "error" | "message", text: string): never =>
  redirect(`/login?${kind}=${encodeURIComponent(text)}`);

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) back("error", "Enter your email and password.");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) back("error", "Email or password is incorrect.");
  redirect("/");
}

// Public sign-up always creates a Requester. The database trigger assigns the role;
// nothing sent from this form can make someone an IT Admin.
export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const full_name = String(formData.get("full_name") ?? "").trim().slice(0, 100);
  if (!full_name) back("error", "Enter your full name to create an account.");
  if (!email || password.length < 8) back("error", "Use a valid email and a password of at least 8 characters.");

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name }, emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) back("error", error.message);
  if (data.session) redirect("/");
  back("message", "Account created. Check your email to confirm it, then sign in.");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
