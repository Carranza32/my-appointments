export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "openid",
].join(" ");

export function getOAuthRedirectUrl(path = "/auth/callback") {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000";
  return `${base}${path}`;
}

export function googleOAuthOptions(redirectTo?: string) {
  return {
    redirectTo: redirectTo ?? getOAuthRedirectUrl(),
    scopes: GOOGLE_CALENDAR_SCOPES,
    queryParams: {
      access_type: "offline",
      prompt: "consent",
    },
  };
}
