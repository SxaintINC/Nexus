// ── SUPABASE CLIENT ───────────────────────────────────────────────────────────
// Single browser client for the whole app. Credentials come from .env.local
// (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) — they are public by design;
// security is enforced server-side by RLS, not by hiding this key.

import { createClient, type AuthError, type Provider, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseReady = Boolean(url && anon);

export const supabase: SupabaseClient = createClient(
  url ?? "http://localhost:54321",
  anon ?? "public-anon-key-placeholder",
  { auth: { persistSession: true, autoRefreshToken: true } },
);

// Map a Supabase AuthError to a human sentence for the forms. Unknown errors
// fall back to the server's own message when it's user-friendly enough.
export function authErrorMessage(e: unknown): string {
  const err = e as AuthError;
  switch (err?.code) {
    case "invalid_credentials":
      return "Incorrect email or password.";
    case "email_not_confirmed":
      return "Please verify your email first — check your inbox for the confirmation link.";
    case "user_already_exists":
    case "email_exists":
      return "An account with this email already exists. Try logging in instead.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts — wait a minute and try again.";
    case "user_banned":
      return "This account has been disabled. Contact your administrator.";
    case "signup_disabled":
      return "New sign-ups are paused. Contact your administrator.";
    case "same_password":
      return "Choose a password different from your current one.";
    case "weak_password":
      return "That password is too weak — use at least 8 characters with a mix of letters, numbers and symbols.";
    default: {
      const msg = err?.message ?? "";
      if (/invalid login credentials/i.test(msg)) return "Incorrect email or password.";
      if (/email not confirmed/i.test(msg)) return "Please verify your email first — check your inbox.";
      if (/already registered|already exists/i.test(msg)) return "An account with this email already exists. Try logging in instead.";
      if (/rate limit/i.test(msg)) return "Too many attempts — wait a minute and try again.";
      if (/failed to fetch|network/i.test(msg)) return "Can't reach the server — check your connection and try again.";
      return msg || "Something went wrong. Please try again.";
    }
  }
}

// The providers we offer as OAuth tiles. "azure" is Supabase's name for
// Microsoft Entra ID. Apple shows only if the project has it configured —
// the error surfaces in the UI either way.
export const OAUTH_PROVIDERS: { id: Provider; label: string }[] = [
  { id: "google", label: "Google" },
  { id: "azure", label: "Microsoft" },
  { id: "apple", label: "Apple" },
];

export function oauthRedirect(): string {
  return `${window.location.origin}/home`;
}

// After an OAuth redirect (or a remembered session), sync Supabase's session
// into the app's lightweight session store and report where we are.
export async function resumeSession(): Promise<boolean> {
  if (!supabaseReady) return false;
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return false;
  const meta = user.user_metadata ?? {};
  const { setCurrentUser } = await import("./session");
  setCurrentUser({
    name: (meta.full_name as string) || (meta.name as string) || "",
    email: user.email ?? "",
    school: (meta.school as string) || "",
    role: (meta.role as string) || "",
  });
  return true;
}
