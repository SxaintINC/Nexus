import { postAuthDestination, resetOnboarding } from "../../../shared/lib/onboarding-store";
import { setCurrentUser } from "../../../shared/lib/session";
import { authErrorMessage, supabase, supabaseReady } from "../../../shared/lib/supabase";

const accountKeyOf = (email: string) => email.trim().toLowerCase();

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  AnimatedCheck,
  AuthShell,
  APP_NAME,
  NexusMark,
  TextField,
  SelectField,
  PrimaryButton,
  GhostButton,
  PageLoader,
  Spinner,
  SocialButtons,
  Divider,
  Checkbox,
  TipBanner,
  StatusPill,
  C,
} from "../../../shared/ui/kit";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

// ── PROGRESSIVE SIGNUP FLOW ───────────────────────────────────────────────────
// Notion-style: email first (or a social provider), then one question per step.
// Every keystroke and the current step are written to localStorage, so if the
// user drops off, entering the same email again resumes exactly where they
// stopped — no fresh start, no visible progress bar.

type Step =
  | "email"
  | "verify"
  | "name"
  | "gender"
  | "phone"
  | "password"
  | "school"
  | "country"
  | "role"
  | "terms";

const FLOW: Step[] = [
  "email",
  "verify",
  "name",
  "gender",
  "phone",
  "password",
  "school",
  "country",
  "role",
  "terms",
];

type Draft = {
  email: string;
  step: Step;
  name: string;
  gender: string;
  phone: string;
  password: string;
  school: string;
  country: string;
  role: string;
  terms: boolean;
  updatedAt: number;
};

const DRAFT_KEY = "nexus-signup-draft";

const EMPTY: Draft = {
  email: "",
  step: "email",
  name: "",
  gender: "",
  phone: "",
  password: "",
  school: "",
  country: "",
  role: "",
  terms: false,
  updatedAt: 0,
};

function loadDraft(): Draft | null {
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Draft;
    if (!parsed?.email || typeof parsed.step !== "string") return null;
    if (!FLOW.includes(parsed.step)) return null;
    // Drafts saved before real auth: the fake code step no longer exists live.
    if (LIVE && parsed.step === "verify") parsed.step = "name";
    // Drop drafts older than 30 days.
    if (Date.now() - (parsed.updatedAt ?? 0) > 30 * 24 * 60 * 60 * 1000) return null;
    return { ...EMPTY, ...parsed };
  } catch {
    return null;
  }
}

function saveDraft(patch: Partial<Draft>) {
  try {
    const current = loadDraft() ?? EMPTY;
    const next = { ...current, ...patch, updatedAt: Date.now() };
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — flow still works, just without resume */
  }
}

function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* noop */
  }
}

const COUNTRIES = ["Nigeria", "Ghana", "Kenya", "Rwanda", "South Africa"];
const GENDERS = ["Female", "Male", "Prefer not to say"];
const ROLES = [
  "Exams Coordinator",
  "Principal / Head Teacher",
  "Teacher",
  "IT Administrator",
  "Other",
];

const EMAIL_RE = /^\S+@\S+\.\S+$/;
// Optional leading +, then digits with spaces/dashes — must contain 7–15 digits.
const PHONE_RE = /^\+?[\d\s-]+$/;
const phoneDigitCount = (p: string) => p.replace(/\D/g, "").length;

// When Supabase is configured, email verification happens by the real
// confirmation LINK Supabase emails out — the in-app fake code step is
// demo-only and is skipped from the flow.
const LIVE = supabaseReady;
const ACTIVE_FLOW = LIVE ? FLOW.filter((s) => s !== "verify") : FLOW;

export default function Signup() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("email");
  const [form, setForm] = useState<Draft>(EMPTY);
  // Any abandoned draft, loaded once — used when the user re-enters their email.
  const [savedDraft] = useState<Draft | null>(() => loadDraft());
  const [error, setError] = useState<string>();
  const [creating, setCreating] = useState(false);
  const [done, setDone] = useState(false);
  // Whether the signup response carried a session (i.e. the project doesn't
  // require email confirmation) — decides the success screen's buttons.
  const [autoSignedIn, setAutoSignedIn] = useState(false);

  // Busy flags for each async moment. If an operation drags on (bad network),
  // `slow` escalates to a full-page loader with rotating status text.
  // Simulated network latency — remove when wiring the real API. In dev you can
  // append ?slow=<ms> to the URL (e.g. /signup?slow=8000) to preview the busy
  // buttons and the full-page "taking a while" loader; production ignores it.
  const SIM_MS = import.meta.env.DEV
    ? Math.min(Number(new URLSearchParams(window.location.search).get("slow")) || 600, 30000)
    : 600;
  const [emailBusy, setEmailBusy] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [slow, setSlow] = useState(false);
  const [slowMsgs, setSlowMsgs] = useState<string[]>([]);
  const slowTimer = useRef<number | undefined>(undefined);

  const beginSlowWatch = (messages: string[]) => {
    setSlowMsgs(messages);
    setSlow(false);
    window.clearTimeout(slowTimer.current);
    slowTimer.current = window.setTimeout(() => setSlow(true), 5000);
  };
  const endSlowWatch = () => {
    window.clearTimeout(slowTimer.current);
    setSlow(false);
  };

  // Verification-code step state.
  const [code, setCode] = useState("");
  const [resendIn, setResendIn] = useState(0);
  // Dev-only: the code the fake "email" would contain, shown on screen so the
  // flow can be tested before real codes are sent. import.meta.env.DEV is
  // statically replaced at build time, so this is dead code in production.
  const [devCode, setDevCode] = useState("");

  // Resend countdown.
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [resendIn]);

  // Clear the slow-watch timer if the component unmounts mid-flight.
  useEffect(() => () => window.clearTimeout(slowTimer.current), []);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      // Persist every keystroke so progress survives a refresh or crash.
      if (next.email) saveDraft({ ...next, step });
      return next;
    });
    if (error) setError(undefined);
  };

  const genCode = () => String(Math.floor(100000 + Math.random() * 900000));

  // "Sends" a verification code with simulated latency. Resends only refresh
  // the code + countdown; fresh sends also transition to the verify step.
  const sendCode = (fresh: boolean, isResend = false) => {
    if (isResend) setResending(true);
    else setEmailBusy(true);
    beginSlowWatch(
      isResend
        ? ["Resending your code…", "The network is being slow…", "Still trying — your code is on its way…"]
        : ["Checking your email…", "Reaching the Nexus servers…", "Recording your progress…"],
    );
    window.setTimeout(() => {
      endSlowWatch();
      // TODO: trigger the real send-code API call here.
      setDevCode(genCode());
      setResendIn(30);
      if (isResend) {
        setResending(false);
        return;
      }
      setCode("");
      setError(undefined);
      // Resuming a verify-step draft also restores the saved answers.
      if (!fresh && savedDraft) setForm((f) => ({ ...savedDraft, email: f.email }));
      setStep("verify");
      saveDraft({ step: "verify", ...(fresh ? { email: form.email } : {}) });
      setEmailBusy(false);
    }, SIM_MS);
  };

  const continueFromEmail = () => {
    if (!EMAIL_RE.test(form.email)) {
      setError("Enter a valid email address.");
      return;
    }
    // Resume: same email as an unfinished draft → jump back to where they stopped.
    if (savedDraft && savedDraft.email.toLowerCase() === form.email.toLowerCase() && savedDraft.step !== "email") {
      if (savedDraft.step !== "verify") {
        // No network needed — restore instantly.
        setForm((f) => ({ ...savedDraft, email: f.email }));
        setError(undefined);
        setStep(savedDraft.step);
        return;
      }
      // Verify-step resumes get a fresh code sent (demo mode only).
      sendCode(false);
      return;
    }
    if (LIVE) {
      // Real Supabase: verification happens via the emailed link after signup,
      // so continue collecting the profile now.
      advance("name");
      return;
    }
    sendCode(true);
  };

  const advance = (next: Step) => {
    setError(undefined);
    setStep(next);
    saveDraft({ step: next });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const back = () => {
    const i = ACTIVE_FLOW.indexOf(step);
    if (i > 0) {
      setError(undefined);
      setStep(ACTIVE_FLOW[i - 1]);
    }
  };

  const submitTerms = async () => {
    if (!form.terms) {
      setError("Please accept the terms to continue.");
      return;
    }
    setCreating(true);
    beginSlowWatch(["Creating your workspace…", "Recording your progress…", "Almost there — hang on…"]);
    if (!supabaseReady) {
      // No Supabase credentials — demo fallback so the flow still completes.
      window.setTimeout(() => {
        endSlowWatch();
        setCreating(false);
        setCurrentUser({ name: form.name, email: form.email, school: form.school, role: form.role });
        clearDraft();
        setDone(true);
      }, SIM_MS + 400);
      return;
    }
    // A brand-new account has never done school setup.
    resetOnboarding(accountKeyOf(form.email));
    const { data, error: err } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        // Profile fields ride along as metadata; a DB trigger will copy them
        // into public.profiles once that table exists.
        data: {
          full_name: form.name,
          gender: form.gender,
          phone: form.phone,
          school: form.school,
          country: form.country,
          role: form.role,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });
    endSlowWatch();
    setCreating(false);
    if (err) {
      setError(authErrorMessage(err));
      return;
    }
    // If the project has "confirm email" disabled, a session comes back
    // immediately — treat that as a finished signup.
    // A brand-new account has never done school setup.
    resetOnboarding(accountKeyOf(form.email));
    if (data.session) {
      setCurrentUser({ name: form.name, email: form.email, school: form.school, role: form.role });
      setAutoSignedIn(true);
    }
    clearDraft();
    setDone(true);
  };

  // ── SUCCESS ─────────────────────────────────────────────────────────────
  if (done) {
    return (
      <AuthShell>
        <div style={{ maxWidth: 460, margin: "0 auto", paddingTop: "9vh", textAlign: "center" }}>
          <div className="nx-fade-up" style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <AnimatedCheck size={82} />
          </div>
          <h1 style={{ fontSize: 27, fontWeight: 700, margin: 0, letterSpacing: "-0.4px" }}>
            Welcome to {APP_NAME}.
          </h1>
          <p style={{ fontSize: 20, fontWeight: 600, color: C.muted, margin: "4px 0 30px" }}>
            Your workspace is being prepared
          </p>

          <div
            style={{
              background: C.card,
              border: `1px solid ${C.lineSoft}`,
              borderRadius: 18,
              padding: "30px 28px",
              boxShadow: "0 20px 50px rgba(30,35,20,0.06)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              alignItems: "center",
            }}
          >
            {autoSignedIn ? (
              <>
                <StatusPill tone="green">Account created</StatusPill>
                <p style={{ fontSize: 14.5, color: C.muted, margin: 0, lineHeight: 1.6 }}>
                  You're signed in as <strong style={{ color: C.ink }}>{form.email}</strong>. One last
                  step — set up your school, then you're in.
                </p>
                <div style={{ marginTop: 6 }}>
                  <PrimaryButton onClick={() => navigate(postAuthDestination(accountKeyOf(form.email)))}>
                    Set up your school →
                  </PrimaryButton>
                </div>
              </>
            ) : (
              <>
                <StatusPill tone="green">Confirm your email</StatusPill>
                <p style={{ fontSize: 14.5, color: C.muted, margin: 0, lineHeight: 1.6 }}>
                  We sent a confirmation link to <strong style={{ color: C.ink }}>{form.email}</strong>.
                  Open it, then sign in — your workspace continues from there.
                </p>
                <div style={{ marginTop: 6 }}>
                  <Link to="/login" style={{ textDecoration: "none" }}>
                    <PrimaryButton>Back to sign in</PrimaryButton>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </AuthShell>
    );
  }

  const at = (s: Step) => step === s;

  return (
    <AuthShell>
      <style>{"@media (max-width: 640px){ .nexus-social{ grid-template-columns: 1fr !important; } }"}</style>
      {slow && <PageLoader messages={slowMsgs} />}
      <div style={{ maxWidth: 460, margin: "0 auto", paddingTop: "9vh" }}>
        {/* Centered brand + headline, Notion-style */}
        <div className="nx-fade-up" style={{ display: "flex", justifyContent: "center", marginBottom: 26 }}>
          <NexusMark size={46} />
        </div>
        <h1
          className="nx-fade-up"
          style={{ textAlign: "center", fontSize: 27, fontWeight: 700, margin: 0, letterSpacing: "-0.4px", animationDelay: "60ms" }}
        >
          {APP_NAME}: your exam workspace.
        </h1>
        <p
          className="nx-fade-up"
          style={{ textAlign: "center", fontSize: 22, fontWeight: 600, color: C.muted, margin: "4px 0 34px", animationDelay: "120ms" }}
        >
          {at("email") ? "Sign up with your work email" : "Let's set up your account"}
        </p>

        {/* ── STEP: EMAIL ──────────────────────────────────────────────── */}
        {at("email") && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              continueFromEmail();
            }}
            noValidate
          >
            <TextField
              label="Work email"
              name="email"
              type="email"
              value={form.email}
              onChange={(v) => set("email", v)}
              placeholder="you@school.edu.ng"
              autoComplete="email"
              error={error}
              clearable
            />
            <div style={{ height: 16 }} />
            {savedDraft && (
              <div style={{ marginBottom: 16 }}>
                <TipBanner>
                  Tip: we saved your progress from a previous session — enter the same email to
                  pick up right where you stopped.
                </TipBanner>
              </div>
            )}
            <PrimaryButton type="submit" full loading={emailBusy}>
              {emailBusy ? "Checking…" : "Continue"}
            </PrimaryButton>
          </form>
        )}

        {/* ── STEP: VERIFY CODE (demo mode only — live auth verifies by email link) */}
        {at("verify") && !LIVE && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!/^\d{6}$/.test(code)) {
                setError("Enter the 6-digit code from your inbox.");
                return;
              }
              // TODO: validate against the code the real API sent.
              if (import.meta.env.DEV && code !== devCode) {
                setError("Incorrect code — check the dev code banner above.");
                return;
              }
              setVerifyBusy(true);
              beginSlowWatch(["Verifying your code…", "Recording your progress…", "The network is being slow…"]);
              window.setTimeout(() => {
                endSlowWatch();
                setVerifyBusy(false);
                advance("name");
              }, SIM_MS);
            }}
            noValidate
          >
            <TextField
              label="Work email"
              name="email"
              type="email"
              value={form.email}
              onChange={(v) => set("email", v)}
              autoComplete="email"
              clearable
            />
            <p style={{ fontSize: 13, color: C.faint, margin: "8px 2px 22px" }}>
              Use an organization email to easily collaborate with teammates
            </p>
            {resending ? (
              // While resending, the input is replaced by a spinner row.
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  border: `1px solid ${C.line}`,
                  borderRadius: 14,
                  background: C.white,
                  padding: "13px 14px",
                  color: C.muted,
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                <Spinner size={17} color={C.green} />
                Resending your code…
              </div>
            ) : (
              <>
                <TextField
                  label="Verification code"
                  name="code"
                  value={code}
                  onChange={(v) => {
                    setCode(v.replace(/\D/g, "").slice(0, 6));
                    if (error) setError(undefined);
                  }}
                  placeholder="Enter code"
                  error={error}
                />
                <p style={{ fontSize: 13, color: C.faint, margin: "8px 2px 0" }}>
                  We sent a code to your inbox
                </p>
              </>
            )}
            {import.meta.env.DEV && devCode && (
              <TipBanner>
                <span style={{ fontWeight: 700 }}>[DEV ONLY]</span> Your verification code is{" "}
                <strong style={{ letterSpacing: "2px" }}>{devCode}</strong> — in production this
                arrives by email.
              </TipBanner>
            )}
            <div style={{ height: 18 }} />
            <PrimaryButton type="submit" full loading={verifyBusy}>
              {verifyBusy ? "Verifying…" : "Continue"}
            </PrimaryButton>
            {resendIn > 0 ? (
              <p style={{ textAlign: "center", fontSize: 13.5, color: C.faint, marginTop: 14 }}>
                Resend in {resendIn}s
              </p>
            ) : (
              <button
                type="button"
                onClick={() => sendCode(true, true)}
                style={{
                  display: "block",
                  margin: "14px auto 0",
                  background: "none",
                  border: "none",
                  color: C.green,
                  fontWeight: 600,
                  fontSize: 13.5,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                Resend verification code
              </button>
            )}
            <Divider />
            <div className="nexus-social">
              <SocialButtons />
            </div>
          </form>
        )}

        {/* ── STEP: NAME ───────────────────────────────────────────────── */}
        {at("name") && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (form.name.trim().length < 2) {
                setError("Enter your full name.");
                return;
              }
              advance("gender");
            }}
            noValidate
          >
            <Question label="What's your full name?" hint="As it should appear on official records.">
              <TextField
                label="Full name"
                name="name"
                value={form.name}
                onChange={(v) => set("name", v)}
                placeholder="Adaeze Okafor"
                autoComplete="name"
                error={error}
                clearable
              />
            </Question>
            <StepActions onBack={back} />
          </form>
        )}

        {/* ── STEP: GENDER ─────────────────────────────────────────────── */}
        {at("gender") && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.gender) {
                setError("Select an option.");
                return;
              }
              advance("phone");
            }}
            noValidate
          >
            <Question label="How do you identify?">
              <SelectField
                label="Gender"
                name="gender"
                value={form.gender}
                onChange={(v) => set("gender", v)}
                options={GENDERS}
                error={error}
              />
            </Question>
            <StepActions onBack={back} />
          </form>
        )}

        {/* ── STEP: PHONE ──────────────────────────────────────────────── */}
        {at("phone") && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!PHONE_RE.test(form.phone) || phoneDigitCount(form.phone) < 7 || phoneDigitCount(form.phone) > 15) {
                setError("Enter a valid phone number.");
                return;
              }
              advance("password");
            }}
            noValidate
          >
            <Question label="What's your phone number?" hint="For exam-day alerts and account recovery.">
              <TextField
                label="Phone number"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={(v) => set("phone", v)}
                placeholder="+234 1 234 5678"
                autoComplete="tel"
                error={error}
                clearable
              />
            </Question>
            <StepActions onBack={back} />
          </form>
        )}

        {/* ── STEP: PASSWORD ───────────────────────────────────────────── */}
        {at("password") && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (form.password.length < 8) {
                setError("Use at least 8 characters.");
                return;
              }
              advance("school");
            }}
            noValidate
          >
            <Question label="Create a password" hint="8+ characters with a mix of letters, numbers & symbols.">
              <TextField
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={(v) => set("password", v)}
                placeholder="••••••••"
                autoComplete="new-password"
                error={error}
              />
            </Question>
            <StepActions onBack={back} />
          </form>
        )}

        {/* ── STEP: SCHOOL ─────────────────────────────────────────────── */}
        {at("school") && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (form.school.trim().length < 2) {
                setError("Enter your school's name.");
                return;
              }
              advance("country");
            }}
            noValidate
          >
            <Question label="What school do you represent?">
              <TextField
                label="School name"
                name="school"
                value={form.school}
                onChange={(v) => set("school", v)}
                placeholder="Day Waterman College"
                error={error}
                clearable
              />
            </Question>
            <StepActions onBack={back} />
          </form>
        )}

        {/* ── STEP: COUNTRY ────────────────────────────────────────────── */}
        {at("country") && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.country) {
                setError("Select a country.");
                return;
              }
              advance("role");
            }}
            noValidate
          >
            <Question label="Where is your school located?">
              <SelectField
                label="Country"
                name="country"
                value={form.country}
                onChange={(v) => set("country", v)}
                options={COUNTRIES}
                error={error}
              />
            </Question>
            <StepActions onBack={back} />
          </form>
        )}

        {/* ── STEP: ROLE ───────────────────────────────────────────────── */}
        {at("role") && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!form.role) {
                setError("Select a role.");
                return;
              }
              advance("terms");
            }}
            noValidate
          >
            <Question label="What's your role at the school?" hint="This helps us tailor Nexus to your workflow.">
              <SelectField
                label="Role"
                name="role"
                value={form.role}
                onChange={(v) => set("role", v)}
                options={ROLES}
                error={error}
              />
            </Question>
            <StepActions onBack={back} />
          </form>
        )}

        {/* ── STEP: TERMS ──────────────────────────────────────────────── */}
        {at("terms") && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitTerms();
            }}
            noValidate
          >
            <Question label="Almost done" hint={`Signing up as ${form.email}`}>
              <div style={{ marginBottom: 8 }}>
                <Checkbox
                  checked={form.terms}
                  onChange={(v) => {
                    set("terms", v);
                    if (v) setError(undefined);
                  }}
                >
                  I agree to the{" "}
                  <span style={{ fontWeight: 600, color: C.ink, textDecoration: "underline" }}>
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span style={{ fontWeight: 600, color: C.ink, textDecoration: "underline" }}>
                    Privacy Policy
                  </span>
                  .
                </Checkbox>
                {error && (
                  <div style={{ fontSize: 12.5, color: C.red, marginTop: 6 }}>{error}</div>
                )}
              </div>
            </Question>
            <div style={{ height: 14 }} />
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <GhostButton onClick={back}>
                <CaretLeft size={14} weight="bold" />
                Previous
              </GhostButton>
              <PrimaryButton type="submit" loading={creating}>
                {creating ? "Creating…" : "Create account"}
              </PrimaryButton>
            </div>
          </form>
        )}

        {/* Social entry only makes sense before an account exists */}
        {at("email") && (
          <>
            <Divider />
            <div className="nexus-social">
              <SocialButtons />
            </div>
            <p style={{ textAlign: "center", fontSize: 13, color: C.faint, marginTop: 26, lineHeight: 1.6 }}>
              By continuing, you acknowledge that you understand and agree to the{" "}
              <span style={{ textDecoration: "underline" }}>Terms &amp; Conditions</span> and{" "}
              <span style={{ textDecoration: "underline" }}>Privacy Policy</span>
            </p>
          </>
        )}

        {(at("email") || at("verify")) && (
          <p style={{ textAlign: "center", fontSize: 13, color: C.muted, marginTop: 22 }}>
            Already registered?{" "}
            <Link to="/login" style={{ color: C.green, fontWeight: 600, textDecoration: "none" }}>
              Sign in
            </Link>
          </p>
        )}
      </div>
    </AuthShell>
  );
}

// Shared chrome for every question step.
function Question({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <h2 style={{ fontSize: 21, fontWeight: 700, margin: "0 0 22px", letterSpacing: "-0.3px" }}>{label}</h2>
      {children}
      {hint && <p style={{ fontSize: 13, color: C.faint, margin: "10px 2px 0" }}>{hint}</p>}
    </>
  );
}

function StepActions({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 26 }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          background: "none",
          border: "none",
          color: C.faint,
          fontSize: 13.5,
          fontWeight: 500,
          cursor: "pointer",
          fontFamily: "inherit",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: 0,
        }}
      >
        <CaretLeft size={14} weight="bold" />
        Back
      </button>
      <PrimaryButton type="submit">
        Continue
        <CaretRight size={14} weight="bold" />
      </PrimaryButton>
    </div>
  );
}
