// ── ONBOARDING STORE ──────────────────────────────────────────────────────────
// School setup wizard state, persisted to localStorage so an admin can resume
// the wizard after a refresh. State is KEYED BY THE LOGGED-IN ACCOUNT, so a
// brand-new signup always starts the wizard fresh instead of seeing another
// account's (or the demo's) completed setup.

export type Term = {
  id: string;
  name: string;
  description: string;
  start: string; // yyyy-mm-dd
  end: string;
  current: boolean;
};

export type ClassRow = {
  id: string;
  name: string; // e.g. "JSS 1"
  level: string; // e.g. "Junior secondary"
  arms: string; // comma separated, e.g. "A, B"
};

export type Subject = {
  id: string;
  name: string;
  code: string;
};

export type TestType = {
  id: string;
  name: string; // e.g. "1st CA"
  maxScore: number;
};

export type GradeBand = {
  id: string;
  grade: string; // e.g. "A"
  min: number;
  max: number;
  remark: string;
};

export type Fee = {
  id: string;
  title: string;
  amount: number;
  appliesTo: string; // "All classes" or a class name
};

export type Onboarding = {
  session: string; // e.g. "2026/2027"
  terms: Term[];
  classes: ClassRow[];
  subjects: Subject[];
  testTypes: TestType[];
  grading: GradeBand[];
  fees: Fee[];
  step: number; // 0..5
  done: boolean;
  updatedAt: number;
};

const LEGACY_KEY = "nexus-onboarding"; // pre-accounts single-tenant key
const keyFor = (accountKey: string) => `nexus-onboarding:v1:${accountKey.trim().toLowerCase()}`;

export const STEP_LABELS = [
  "Session and Term",
  "Class",
  "Subject",
  "Test Type",
  "Grading",
  "Fee",
];

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Sensible starting point — the school can edit or delete these, matching the
// reference where the wizard pre-fills the standard Nigerian term structure.
export function defaultOnboarding(): Onboarding {
  const y = new Date().getFullYear();
  return {
    session: `${y}/${y + 1}`,
    terms: [
      { id: uid(), name: "First term", description: "", start: "", end: "", current: true },
      { id: uid(), name: "Second term", description: "", start: "", end: "", current: false },
      { id: uid(), name: "Third term", description: "", start: "", end: "", current: false },
    ],
    classes: [
      { id: uid(), name: "JSS 1", level: "Junior secondary", arms: "A, B" },
      { id: uid(), name: "JSS 2", level: "Junior secondary", arms: "A, B" },
      { id: uid(), name: "SS 1", level: "Senior secondary", arms: "A, B" },
    ],
    subjects: [
      { id: uid(), name: "Mathematics", code: "MTH" },
      { id: uid(), name: "English Language", code: "ENG" },
      { id: uid(), name: "Basic Science", code: "BSC" },
    ],
    testTypes: [
      { id: uid(), name: "1st CA", maxScore: 20 },
      { id: uid(), name: "2nd CA", maxScore: 20 },
      { id: uid(), name: "Exam", maxScore: 60 },
    ],
    grading: [
      { id: uid(), grade: "A", min: 70, max: 100, remark: "Excellent" },
      { id: uid(), grade: "B", min: 60, max: 69, remark: "Very good" },
      { id: uid(), grade: "C", min: 50, max: 59, remark: "Good" },
      { id: uid(), grade: "D", min: 45, max: 49, remark: "Fair" },
      { id: uid(), grade: "E", min: 40, max: 44, remark: "Pass" },
      { id: uid(), grade: "F", min: 0, max: 39, remark: "Fail" },
    ],
    fees: [{ id: uid(), title: "Tuition", amount: 0, appliesTo: "All classes" }],
    step: 0,
    done: false,
    updatedAt: 0,
  };
}

// One-time carry-over: data saved before the store became per-account moves to
// the current account's key so nobody loses their setup after upgrading.
function migrateLegacy(accountKey: string) {
  try {
    const raw = window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    const target = keyFor(accountKey);
    if (!window.localStorage.getItem(target)) {
      window.localStorage.setItem(target, raw);
    }
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* storage unavailable */
  }
}

export function loadOnboarding(accountKey: string): Onboarding | null {
  if (!accountKey) return null;
  try {
    migrateLegacy(accountKey);
    const raw = window.localStorage.getItem(keyFor(accountKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Onboarding;
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.terms)) return null;
    return { ...defaultOnboarding(), ...parsed };
  } catch {
    return null;
  }
}

export function saveOnboarding(accountKey: string, data: Onboarding) {
  if (!accountKey) return;
  try {
    window.localStorage.setItem(
      keyFor(accountKey),
      JSON.stringify({ ...data, updatedAt: Date.now() }),
    );
  } catch {
    /* storage unavailable — wizard still works, just without resume */
  }
}

export function markOnboardingDone(accountKey: string, data: Onboarding) {
  saveOnboarding(accountKey, { ...data, done: true });
}

export function isOnboardingDone(accountKey: string): boolean {
  return loadOnboarding(accountKey)?.done === true;
}

// Discard everything and start the wizard from the defaults — used by the
// "Start over" control on the setup console.
export function resetOnboarding(accountKey: string) {
  if (!accountKey) return;
  try {
    window.localStorage.removeItem(keyFor(accountKey));
  } catch {
    /* noop */
  }
}

// Where a freshly authenticated user should land. Reads the CURRENT account's
// onboarding state — not "anyone's" — so new signups get the wizard.
export function postAuthDestination(accountKey: string): string {
  return isOnboardingDone(accountKey) ? "/home" : "/onboarding";
}
