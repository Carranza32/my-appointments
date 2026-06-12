import { NextResponse } from "next/server";
import { persistGoogleAccountFromSession } from "@/actions/google-calendar";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");
  const next = searchParams.get("next") ?? "/dashboard/integrations";

  if (oauthError) {
    const url = new URL(next, origin);
    url.searchParams.set("google", "error");
    url.searchParams.set("message", oauthError);
    return NextResponse.redirect(url);
  }

  if (!code) {
    const url = new URL(next, origin);
    url.searchParams.set("google", "error");
    url.searchParams.set("message", "Código OAuth no recibido");
    return NextResponse.redirect(url);
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    const url = new URL(next, origin);
    url.searchParams.set("google", "error");
    url.searchParams.set("message", exchangeError.message);
    return NextResponse.redirect(url);
  }

  // Retrieve session to check if this is a Google OAuth connection (has provider token)
  const { data: { session } } = await supabase.auth.getSession();
  const hasProviderToken = Boolean(session?.provider_token);

  const url = new URL(next, origin);

  if (hasProviderToken && next.includes("integrations")) {
    const result = await persistGoogleAccountFromSession();
    if (result?.error) {
      url.searchParams.set("google", "error");
      url.searchParams.set("message", result.error);
    } else {
      url.searchParams.set("google", "connected");
    }
  }

  return NextResponse.redirect(url);
}
