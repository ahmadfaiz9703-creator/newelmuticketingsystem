import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Landing page for the email-confirmation link sent after sign-up.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/`);
  }
  const msg = encodeURIComponent("That confirmation link is invalid or has expired. Try signing in or sign up again.");
  return NextResponse.redirect(`${origin}/login?error=${msg}`);
}
