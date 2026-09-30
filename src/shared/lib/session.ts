// ── SESSION ──────────────────────────────────────────────────────────────────
// Minimal client-side session so the app knows who just signed up or logged
// in. Replace with real auth tokens when the API exists — everything reads
// through `currentUser()`, so the swap is one file.

export type User = {
  name: string;
  email: string;
  school: string;
  role: string;
};

const KEY = "nexus-session";
const EXTRA_KEY = "nexus-signup-draft"; // read-only, for older sessions

export function setCurrentUser(user: User) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...user, at: Date.now() }));
  } catch {
    /* storage unavailable */
  }
}

export function currentUser(): User | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as User & { at?: number };
      if (parsed?.email || parsed?.name) {
        return { name: parsed.name, email: parsed.email, school: parsed.school, role: parsed.role };
      }
    }
    // Fallback: derive a lightweight identity from an existing signup draft so
    // sessions created before this store existed still get a greeting.
    const draftRaw = window.localStorage.getItem(EXTRA_KEY);
    if (draftRaw) {
      const d = JSON.parse(draftRaw) as { email?: string; name?: string; school?: string; role?: string };
      if (d?.email) {
        return { name: d.name ?? "", email: d.email, school: d.school ?? "", role: d.role ?? "" };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function clearCurrentUser() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

// Demo fallback identity so the admin console always has a logged-in user to
// show (mirrors the reference where the console greets the super admin).
// Remove once real auth lands.
export function ensureSession(): User {
  return (
    currentUser() ?? {
      name: "Dr. Darlington Ajaezo",
      email: "darlington.ajaezo@school.edu.ng",
      school: "Darlington Ajaezo Academy",
      role: "Super Administrator",
    }
  );
}

// "darlington ajayi" → "Darlington Ajayi"; falls back to the email local-part.
export function displayName(): string {
  const u = ensureSession();
  if (!u) return "there";
  const n = u.name.trim();
  if (n) {
    return n
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  const local = u.email.split("@")[0] ?? "";
  const word = local.split(/[._-]/)[0] || "there";
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function firstName(): string {
  const parts = displayName().split(" ");
  // Skip honorifics so "Dr. Darlington Ajaezo" greets as "Darlington".
  const first = parts.find((p) => !/^(dr|mr|mrs|ms|prof|chief|alhaji)\.?$/i.test(p));
  return first || "there";
}

// Greeting bucketed by local time, e.g. "Good morning".
export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
