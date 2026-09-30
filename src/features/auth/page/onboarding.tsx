import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowCounterClockwise,
  Bell,
  CalendarDots,
  CaretDown,
  CaretLeft,
  CaretRight,
  Check,
  Plus,
  WarningCircle,
  X,
} from "@phosphor-icons/react";

import {
  AnimatedCheck,
  AuthShell,
  C,
  NexusMark,
  PrimaryButton,
  SERIF,
  StatusPill,
} from "../../../shared/ui/kit";
import {
  STEP_LABELS,
  defaultOnboarding,
  loadOnboarding,
  markOnboardingDone,
  resetOnboarding,
  saveOnboarding,
  uid,
  type Onboarding,
} from "../../../shared/lib/onboarding-store";
import { clearCurrentUser, ensureSession } from "../../../shared/lib/session";
import { supabase, supabaseReady } from "../../../shared/lib/supabase";


// durable across devices and available to the API later.
async function syncSetupToSupabase(data: Onboarding) {
  if (!supabaseReady) return;
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uidFromAuth = auth?.user?.id;
    if (!uidFromAuth) return;
    await supabase.from("profiles").update({ onboarding_done: true }).eq("id", uidFromAuth);
    const schoolName = auth?.user?.user_metadata?.school || null;
    await supabase.from("schools").upsert(
      {
        owner_id: uidFromAuth,
        name: schoolName ?? "My School",
        setup: {
          session: data.session,
          terms: data.terms,
          classes: data.classes,
          subjects: data.subjects,
          testTypes: data.testTypes,
          grading: data.grading,
          fees: data.fees,
        },
        onboarding_done: true,
      },
      { onConflict: "owner_id" },
    );
  } catch {
    /* non-fatal — local state already saved */
  }
}

// ── SCHOOL SETUP CONSOLE ──────────────────────────────────────────────────────
// Post-signup onboarding, styled like a logged-in admin console (the reference
// screenshots): top bar with the session/term pill, billing chip, "Hi … /
// Logged In As" block and LOG OUT; a console nav; then the setup checklist
// sidebar and one editable table per step.
//
// The console is ALWAYS editable — finishing setup just shows a success
// screen, it never locks the page. "Start over" wipes the saved wizard data.

const FONT = "Inter, system-ui, -apple-system, sans-serif";

type RowKind = "terms" | "classes" | "subjects" | "testTypes" | "grading" | "fees";

const STEP_HINTS: Record<number, string> = {
  0: "Name the academic session, set the term dates and mark the term you're currently in.",
  1: "The classes your school runs, with arms (A, B, C) where they exist.",
  2: "Subjects offered across the school, with short codes for report cards.",
  3: "Assessments that make up a student's score — the marks should total 100.",
  4: "Score bands that map to letter grades and remarks on report cards.",
  5: "Fee items you'll bill per term. You can add more later in Settings.",
};

export default function Onboarding() {
  const navigate = useNavigate();
  const user = ensureSession(); // demo identity so the console always shows a logged-in admin
  // The wizard belongs to the LOGGED-IN ACCOUNT — a fresh signup never sees
  // another account's completed setup.
  const accountKey = user.email.toLowerCase();
  const [data, setData] = useState<Onboarding>(() => loadOnboarding(accountKey) ?? defaultOnboarding());
  const [saved, setSaved] = useState(() => loadOnboarding(accountKey)?.done === true);
  const [bannerOpen, setBannerOpen] = useState(() => loadOnboarding(accountKey)?.done === true);
  const [done, setDone] = useState(false); // brief "saving" state on Finish

  const step = Math.min(data.step, STEP_LABELS.length - 1);

  const persist = (next: Onboarding) => {
    setData(next);
    saveOnboarding(accountKey, next);
  };

  const patch = (kind: RowKind, id: string, key: string, value: string | number | boolean) => {
    persist({
      ...data,
      [kind]: (data[kind] as Array<Record<string, unknown>>).map((r) =>
        r.id === id ? { ...r, [key]: value } : r,
      ),
    });
  };

  // Exactly one term carries the "current" flag.
  const setCurrentTerm = (id: string) => {
    persist({ ...data, terms: data.terms.map((r) => ({ ...r, current: r.id === id })) });
  };

  const setSession = (session: string) => persist({ ...data, session });

  const addRow = (kind: RowKind) => {
    const blank: Record<string, unknown> = { id: uid() };
    if (kind === "terms") Object.assign(blank, { name: "", description: "", start: "", end: "", current: false });
    if (kind === "classes") Object.assign(blank, { name: "", level: "", arms: "" });
    if (kind === "subjects") Object.assign(blank, { name: "", code: "" });
    if (kind === "testTypes") Object.assign(blank, { name: "", maxScore: 0 });
    if (kind === "grading") Object.assign(blank, { grade: "", min: 0, max: 0, remark: "" });
    if (kind === "fees") Object.assign(blank, { title: "", amount: 0, appliesTo: "All classes" });
    persist({ ...data, [kind]: [...(data[kind] as Array<Record<string, unknown>>), blank] });
  };

  const removeRow = (kind: RowKind, id: string) => {
    persist({ ...data, [kind]: (data[kind] as Array<{ id: string }>).filter((r) => r.id !== id) });
  };

  const next = () => {
    if (step < STEP_LABELS.length - 1) {
      persist({ ...data, step: step + 1 });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // Finish: mark done locally AND in the account's server profile (best-effort),
    // flash the success screen, then return to the editable console.
    markOnboardingDone(accountKey, data);
    void syncSetupToSupabase(data);
    setDone(true);
    setSaved(true);
    window.setTimeout(() => {
      setDone(false);
      setBannerOpen(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 1600);
  };

  const back = () => {
    if (step > 0) {
      persist({ ...data, step: step - 1 });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const startOver = () => {
    if (!window.confirm("Start over? This clears everything you've entered in the setup wizard.")) return;
    resetOnboarding(accountKey);
    setData(defaultOnboarding());
    setSaved(false);
    setBannerOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (done) {
    return (
      <AuthShell>
        <div style={{ maxWidth: 460, margin: "0 auto", paddingTop: "9vh", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <AnimatedCheck size={82} />
          </div>
          <h1 style={{ fontSize: 27, fontWeight: 700, margin: 0, letterSpacing: "-0.4px" }}>
            Setup complete.
          </h1>
          <p style={{ fontSize: 20, fontWeight: 600, color: C.muted, margin: "4px 0 30px" }}>
            Nexus is ready for the {data.session} session
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
            <StatusPill tone="green">Workspace configured</StatusPill>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%" }}>
              <StatBox value={String(data.classes.length + data.subjects.length + data.terms.length)} label="Items configured" />
              <StatBox value={String(data.classes.length)} label="Classes" />
              <StatBox value={String(data.subjects.length)} label="Subjects" />
              <StatBox value={String(data.grading.length)} label="Grade bands" />
            </div>
            <PrimaryButton full onClick={() => navigate("/home")}>
              Go to dashboard
            </PrimaryButton>
          </div>
          <p style={{ fontSize: 12.5, color: C.faint, marginTop: 18 }}>
            Setup stays editable — reopen it anytime from the dashboard.
          </p>
        </div>
      </AuthShell>
    );
  }

  const currentTermName = data.terms.find((t) => t.current)?.name || "First term";
  const totalRows = data.classes.length + data.subjects.length + data.terms.length;

  return (
    <AdminShell user={user} session={data.session} term={currentTermName}>
      {saved && bannerOpen && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: C.amberWash,
            borderRadius: 12,
            padding: "10px 14px",
            fontSize: 13,
            color: C.amber,
            fontWeight: 500,
            marginBottom: 18,
          }}
        >
          <WarningCircle size={15} />
          <span style={{ flex: 1 }}>
            Setup was completed earlier — everything below stays editable. “Start over” resets to the defaults.
          </span>
          <button
            type="button"
            onClick={() => setBannerOpen(false)}
            style={{ border: "none", background: "transparent", color: C.amber, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: 12.5 }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Breadcrumb title, reference-style */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "0 4px 20px" }}>
        <div>
          <button
            type="button"
            onClick={() => navigate("/home")}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: 0, color: C.faint, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
          >
            ← Back to dashboard
          </button>
          <div style={{ marginTop: 8 }}>
            <span style={{ color: C.muted, fontSize: 15 }}>{data.session || "School setup"}</span>
            <span style={{ color: C.faint, margin: "0 8px" }}>»</span>
            <span
              style={{
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: "1px",
                textTransform: "uppercase",
                borderBottom: `2px solid ${C.green}`,
                paddingBottom: 6,
              }}
            >
              {STEP_LABELS[step]}
            </span>
          </div>
        </div>
        <StatusPill tone={saved ? "green" : "amber"}>
          {saved ? "Setup complete" : `Step ${step + 1} of ${STEP_LABELS.length}`}
        </StatusPill>
      </div>

      <div className="admin-console" style={{ display: "flex", gap: 22, alignItems: "flex-start" }}>
        {/* Checklist sidebar */}
        <aside
          className="admin-aside"
          style={{
            width: 216,
            flexShrink: 0,
            background: C.card,
            border: `1px solid ${C.lineSoft}`,
            borderRadius: 16,
            padding: "16px 0 14px",
            boxShadow: "0 12px 30px rgba(30,35,20,0.05)",
            position: "sticky",
            top: 84,
          }}
        >
          {STEP_LABELS.map((label, i) => {
            const active = i === step;
            return (
              <button
                key={label}
                type="button"
                className="nx-check-item"
                onClick={() => persist({ ...data, step: i })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  background: "none",
                  border: "none",
                  borderLeft: `3px solid ${active ? C.green : "transparent"}`,
                  padding: "11px 14px",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 13.5,
                  fontWeight: active ? 700 : 500,
                  color: active ? C.green : i < step ? C.ink : C.faint,
                  textAlign: "left",
                  animationDelay: `${i * 45}ms`,
                }}
              >
                <CheckDot done={i < step} active={active} />
                {label}
              </button>
            );
          })}

          {/* Wizard progress bar */}
          <div style={{ padding: "12px 14px 0" }}>
            <div style={{ fontSize: 11.5, color: C.faint, marginBottom: 6, fontWeight: 600 }}>
              {Math.round(((step + 1) / STEP_LABELS.length) * 100)}% complete
            </div>
            <div style={{ height: 5, borderRadius: 999, background: C.lineSoft, overflow: "hidden" }}>
              <div
                className="nx-progress-fill"
                style={{
                  height: "100%",
                  width: `${((step + 1) / STEP_LABELS.length) * 100}%`,
                  background: `linear-gradient(90deg, ${C.green}, ${C.greenDark})`,
                  borderRadius: 999,
                }}
              />
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${C.lineSoft}`, margin: "12px 14px 10px", paddingTop: 10, paddingLeft: 2 }}>
            <div style={{ fontSize: 12, color: saved ? C.greenDark : C.faint, display: "flex", alignItems: "center", gap: 6, fontWeight: saved ? 600 : 500 }}>
              {saved ? "All steps saved — edit anytime" : `${step + 1}/${STEP_LABELS.length} · saved automatically`}
            </div>
            <button
              type="button"
              onClick={startOver}
              style={{
                marginTop: 8,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                border: `1px solid ${C.line}`,
                borderRadius: 999,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                color: C.muted,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <ArrowCounterClockwise size={12} weight="bold" />
              Start over
            </button>
          </div>
        </aside>

        {/* Step content — remounts per step so the settle animation replays */}
        <div
          key={step}
          className="nx-step"
          style={{
            flex: 1,
            minWidth: 0,
            background: C.card,
            border: `1px solid ${C.lineSoft}`,
            borderRadius: 16,
            padding: "22px 24px 20px",
            boxShadow: "0 12px 30px rgba(30,35,20,0.05)",
            minHeight: 380,
          }}
        >
          <p style={{ fontSize: 13, color: C.faint, margin: "0 0 16px", lineHeight: 1.5 }}>{STEP_HINTS[step]}</p>

          {step === 0 && (
            <StepSession
              data={data}
              patch={patch}
              removeRow={removeRow}
              addRow={addRow}
              setCurrentTerm={setCurrentTerm}
              setSession={setSession}
            />
          )}
          {step === 1 && <StepClasses data={data} patch={patch} removeRow={removeRow} addRow={addRow} />}
          {step === 2 && <StepSubjects data={data} patch={patch} removeRow={removeRow} addRow={addRow} />}
          {step === 3 && <StepTestTypes data={data} patch={patch} removeRow={removeRow} addRow={addRow} />}
          {step === 4 && <StepGrading data={data} patch={patch} removeRow={removeRow} addRow={addRow} />}
          {step === 5 && <StepFees data={data} patch={patch} removeRow={removeRow} addRow={addRow} />}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 22,
              gap: 12,
            }}
          >
            {step === 0 ? (
              <span style={{ fontSize: 12.5, color: C.faint }}>
                {totalRows} items configured so far
              </span>
            ) : (
              <button
                type="button"
                onClick={back}
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
            )}
            <PrimaryButton onClick={next} loading={done}>
              {done ? "Saving…" : step === STEP_LABELS.length - 1 ? "Finish setup" : "Save and Continue"}
              {!done && <CaretRight size={14} weight="bold" />}
            </PrimaryButton>
          </div>
        </div>
      </div>

      <p style={{ textAlign: "center", fontSize: 12.5, color: C.faint, margin: "18px 0 40px" }}>
        Everything saves as you type — you can leave and resume anytime.
      </p>
    </AdminShell>
  );
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <div style={{ background: C.paper, borderRadius: 12, padding: "12px 10px" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: C.green }}>{value}</div>
      <div style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

function CheckDot({ done, active }: { done: boolean; active: boolean }) {
  return (
    <span
      style={{
        width: 17,
        height: 17,
        borderRadius: "50%",
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: done ? C.greenWash : "transparent",
        border: active ? `1.5px solid ${C.ink}` : `1px solid ${done ? C.greenWash : C.line}`,
      }}
    >
      {done && <Check size={10} weight="bold" color={C.green} />}
    </span>
  );
}

// ── ADMIN CONSOLE SHELL ───────────────────────────────────────────────────────
// The onboarding steps live inside a chrome that looks like the logged-in
// admin console from the reference: school header, session/term pill, billing
// chip, "Logged In As" block with LOG OUT, and the console nav.

type ShellUser = { name: string; role: string };

function AdminShell({
  user,
  session,
  term,
  children,
}: {
  user: ShellUser;
  session: string;
  term: string;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const logout = () => {
    clearCurrentUser();
    navigate("/login");
  };
  const nav = ["Dashboard", "Students", "Staff", "Finance", "Messaging", "Settings"];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.paper,
        fontFamily: FONT,
        color: C.ink,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        className="admin-topbar"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background: C.card,
          borderBottom: `1px solid ${C.lineSoft}`,
          padding: "10px 26px 0",
        }}
      >
        {/* Row 1 — current term pill + billing chip */}
        <div className="admin-hide-sm" style={{ display: "flex", alignItems: "center", gap: 12, padding: "2px 0 8px", flexWrap: "wrap" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: C.paper,
              border: `1px solid ${C.lineSoft}`,
              borderRadius: 999,
              padding: "6px 14px",
              fontSize: 12.5,
              fontWeight: 600,
              color: C.muted,
            }}
          >
            <CalendarDots size={13} color={C.greenDark} />
            Current: {session} ({term})
          </span>
          <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 7 }}>
            <button
              type="button"
              aria-label="Notifications"
              style={{ position: "relative", border: `1px solid ${C.lineSoft}`, background: C.white, width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <Bell size={14} color={C.ink} />
              <span style={{ position: "absolute", top: 7, right: 8, width: 6, height: 6, borderRadius: "50%", background: C.red }} />
            </button>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: C.white,
                border: `1px solid ${C.lineSoft}`,
                borderRadius: 999,
                padding: "6px 14px",
                fontSize: 12.5,
              }}
            >
              <span style={{ color: C.muted }}>Billing Plan:</span>
              <b style={{ color: C.amber, fontWeight: 700 }}>Trial</b>
            </span>
          </span>
        </div>

        {/* Row 2 — school header + logged-in-as + log out */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "2px 0 6px", flexWrap: "wrap" }}>
          <a href="/home" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10 }}>
            <NexusMark size={30} />
            <span style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 600, letterSpacing: "-0.4px", color: C.ink }}>
              {user.name.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.)\s*/i, "")}
            </span>
          </a>

          <div className="admin-hide-sm" style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ textAlign: "right", lineHeight: 1.35 }}>
              <div style={{ fontSize: 13, color: C.muted }}>
                Hi, <span style={{ color: C.greenDark, fontWeight: 600 }}>{user.name}</span>
              </div>
              <div style={{ fontSize: 12.5, color: C.muted }}>
                Logged In As: <span style={{ color: C.greenDark, fontWeight: 600 }}>{user.role}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              style={{
                background: C.white,
                border: `1px solid ${C.line}`,
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.6px",
                color: C.ink,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              LOG OUT
            </button>
          </div>
        </div>

        {/* Row 3 — console nav */}
        <nav className="admin-nav" style={{ display: "flex", gap: 26, overflowX: "auto" }}>
          {nav.map((item, i) => (
            <span
              key={item}
              style={{
                fontSize: 13,
                fontWeight: i === 0 ? 700 : 600,
                color: i === 0 ? C.greenDark : C.muted,
                borderBottom: i === 0 ? `3px solid ${C.green}` : "3px solid transparent",
                paddingBottom: 10,
                whiteSpace: "nowrap",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                cursor: "default",
              }}
            >
              {item}
              {item === "Settings" && <CaretDown size={13} weight="bold" />}
            </span>
          ))}
        </nav>
      </header>

      <div style={{ flex: 1, minWidth: 0, width: "100%", maxWidth: 1060, margin: "0 auto", padding: "22px 26px 0" }}>
        {children}
      </div>

      <style>{`
        @media (max-width: 760px) {
          .admin-console { flex-direction: column !important; }
          .admin-aside { width: 100% !important; position: static !important; }
        }
      `}</style>
    </div>
  );
}

// ── STEP BODIES ───────────────────────────────────────────────────────────────
// Each step is an editable table: inline inputs with add/remove row controls.

function StepHead({ title, hint }: { title: string; hint?: string }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 19, fontWeight: 700, margin: 0, letterSpacing: "-0.2px" }}>{title}</h2>
      {hint && <p style={{ fontSize: 13, color: C.faint, margin: "6px 0 0" }}>{hint}</p>}
    </div>
  );
}

function RowTable({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                style={{
                  textAlign: "left",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  color: C.faint,
                  padding: "6px 8px",
                  borderBottom: `1px solid ${C.lineSoft}`,
                }}
              >
                {h}
              </th>
            ))}
            <th style={{ width: 76 }} />
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Cell({
  value,
  onChange,
  placeholder,
  type = "text",
  width,
}: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  width?: number;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: width ?? "100%",
        border: `1px solid ${C.line}`,
        borderRadius: 9,
        background: C.white,
        padding: "9px 10px",
        fontSize: 13.5,
        fontWeight: 500,
        color: C.ink,
        fontFamily: "inherit",
        outline: "none",
      }}
    />
  );
}

function RowActions({ onRemove }: { onRemove: () => void }) {
  return (
    <td style={{ padding: "7px 8px" }}>
    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
      <button
        type="button"
        aria-label="Remove row"
        onClick={onRemove}
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          border: `1px solid ${C.line}`,
          background: C.white,
          color: C.red,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={13} weight="bold" />
      </button>
    </div>
    </td>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "7px 8px" }}>{children}</td>;
}

type StepProps = {
  data: Onboarding;
  patch: (kind: RowKind, id: string, key: string, value: string | number | boolean) => void;
  removeRow: (kind: RowKind, id: string) => void;
  addRow: (kind: RowKind) => void;
};

function StepSession({
  data,
  patch,
  removeRow,
  addRow,
  setCurrentTerm,
  setSession,
}: StepProps & {
  setCurrentTerm: (id: string) => void;
  setSession: (session: string) => void;
}) {
  return (
    <>
      <StepHead
        title="Session and Term"
        hint="Name the academic session and set the term dates. Mark the term you're currently in."
      />
      <div style={{ maxWidth: 260, marginBottom: 16 }}>
        <input
          value={data.session}
          placeholder="2026/2027"
          onChange={(e) => setSession(e.target.value)}
          style={{
            width: "100%",
            border: `1px solid ${C.line}`,
            borderRadius: 9,
            background: C.white,
            padding: "10px 12px",
            fontSize: 14,
            fontWeight: 600,
            color: C.ink,
            fontFamily: "inherit",
            outline: "none",
          }}
        />
      </div>
      <RowTable headers={["Name", "Description", "Start date", "End date", "Current"]}>
        {data.terms.map((t) => (
          <tr key={t.id}>
            <Td>
              <Cell value={t.name} placeholder="First term" onChange={(v) => patch("terms", t.id, "name", v)} />
            </Td>
            <Td>
              <Cell value={t.description} placeholder="Optional" onChange={(v) => patch("terms", t.id, "description", v)} />
            </Td>
            <Td>
              <Cell type="date" value={t.start} onChange={(v) => patch("terms", t.id, "start", v)} />
            </Td>
            <Td>
              <Cell type="date" value={t.end} onChange={(v) => patch("terms", t.id, "end", v)} />
            </Td>
            <Td>
              <button
                type="button"
                onClick={() => setCurrentTerm(t.id)}
                style={{
                  background: t.current ? C.greenWash : "transparent",
                  border: `1px solid ${t.current ? C.greenWash : C.line}`,
                  borderRadius: 999,
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 600,
                  color: t.current ? C.green : C.faint,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  whiteSpace: "nowrap",
                }}
              >
                {t.current ? "Current" : "Set current"}
              </button>
            </Td>
            <RowActions onRemove={() => removeRow("terms", t.id)} />
          </tr>
        ))}
      </RowTable>
      <AddRowButton label="Add term" onClick={() => addRow("terms")} />
    </>
  );
}

function StepClasses({ data, patch, removeRow, addRow }: StepProps) {
  return (
    <>
      <StepHead title="Classes" hint="The classes your school runs. Add class arms (A, B, C) as needed." />
      <RowTable headers={["Class", "Level", "Arms"]}>
        {data.classes.map((c) => (
          <tr key={c.id}>
            <Td>
              <Cell value={c.name} placeholder="JSS 1" onChange={(v) => patch("classes", c.id, "name", v)} />
            </Td>
            <Td>
              <Cell value={c.level} placeholder="Junior secondary" onChange={(v) => patch("classes", c.id, "level", v)} />
            </Td>
            <Td>
              <Cell value={c.arms} placeholder="A, B" onChange={(v) => patch("classes", c.id, "arms", v)} />
            </Td>
            <RowActions onRemove={() => removeRow("classes", c.id)} />
          </tr>
        ))}
      </RowTable>
      <AddRowButton label="Add class" onClick={() => addRow("classes")} />
    </>
  );
}

function StepSubjects({ data, patch, removeRow, addRow }: StepProps) {
  return (
    <>
      <StepHead title="Subjects" hint="Subjects offered across the school, with short codes for report cards." />
      <RowTable headers={["Subject", "Code"]}>
        {data.subjects.map((s) => (
          <tr key={s.id}>
            <Td>
              <Cell value={s.name} placeholder="Mathematics" onChange={(v) => patch("subjects", s.id, "name", v)} />
            </Td>
            <Td>
              <Cell value={s.code} placeholder="MTH" width={110} onChange={(v) => patch("subjects", s.id, "code", v.toUpperCase())} />
            </Td>
            <RowActions onRemove={() => removeRow("subjects", s.id)} />
          </tr>
        ))}
      </RowTable>
      <AddRowButton label="Add subject" onClick={() => addRow("subjects")} />
    </>
  );
}

function StepTestTypes({ data, patch, removeRow, addRow }: StepProps) {
  const total = data.testTypes.reduce((sum, t) => sum + (Number(t.maxScore) || 0), 0);
  return (
    <>
      <StepHead title="Test Types" hint="Assessments that make up a student's score. The marks should total 100." />
      <RowTable headers={["Type", "Max score"]}>
        {data.testTypes.map((t) => (
          <tr key={t.id}>
            <Td>
              <Cell value={t.name} placeholder="1st CA" onChange={(v) => patch("testTypes", t.id, "name", v)} />
            </Td>
            <Td>
              <Cell type="number" value={t.maxScore} width={110} onChange={(v) => patch("testTypes", t.id, "maxScore", Number(v) || 0)} />
            </Td>
            <RowActions onRemove={() => removeRow("testTypes", t.id)} />
          </tr>
        ))}
        <tr>
          <td style={{ padding: "9px 8px", fontSize: 13, fontWeight: 700, color: C.muted }}>Total</td>
          <td style={{ padding: "9px 8px", fontSize: 13, fontWeight: 700, color: total === 100 ? C.green : C.amber }}>
            {total} {total === 100 ? "✓" : "(should be 100)"}
          </td>
          <td />
        </tr>
      </RowTable>
      <AddRowButton label="Add test type" onClick={() => addRow("testTypes")} />
    </>
  );
}

function StepGrading({ data, patch, removeRow, addRow }: StepProps) {
  return (
    <>
      <StepHead title="Grading" hint="Score bands that map to letter grades and remarks on report cards." />
      <RowTable headers={["Grade", "Min %", "Max %", "Remark"]}>
        {data.grading.map((g) => (
          <tr key={g.id}>
            <Td>
              <Cell value={g.grade} placeholder="A" width={80} onChange={(v) => patch("grading", g.id, "grade", v.toUpperCase())} />
            </Td>
            <Td>
              <Cell type="number" value={g.min} width={100} onChange={(v) => patch("grading", g.id, "min", Number(v) || 0)} />
            </Td>
            <Td>
              <Cell type="number" value={g.max} width={100} onChange={(v) => patch("grading", g.id, "max", Number(v) || 0)} />
            </Td>
            <Td>
              <Cell value={g.remark} placeholder="Excellent" onChange={(v) => patch("grading", g.id, "remark", v)} />
            </Td>
            <RowActions onRemove={() => removeRow("grading", g.id)} />
          </tr>
        ))}
      </RowTable>
      <AddRowButton label="Add band" onClick={() => addRow("grading")} />
    </>
  );
}

function StepFees({ data, patch, removeRow, addRow }: StepProps) {
  return (
    <>
      <StepHead title="Fee" hint="Fee items you'll bill per term. You can add more later." />
      <RowTable headers={["Title", "Amount (₦)", "Applies to"]}>
        {data.fees.map((f) => (
          <tr key={f.id}>
            <Td>
              <Cell value={f.title} placeholder="Tuition" onChange={(v) => patch("fees", f.id, "title", v)} />
            </Td>
            <Td>
              <Cell type="number" value={f.amount} width={130} onChange={(v) => patch("fees", f.id, "amount", Number(v) || 0)} />
            </Td>
            <Td>
              <Cell value={f.appliesTo} placeholder="All classes" onChange={(v) => patch("fees", f.id, "appliesTo", v)} />
            </Td>
            <RowActions onRemove={() => removeRow("fees", f.id)} />
          </tr>
        ))}
      </RowTable>
      <AddRowButton label="Add fee" onClick={() => addRow("fees")} />
    </>
  );
}

function AddRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        marginTop: 14,
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        background: C.ink,
        border: "none",
        borderRadius: 999,
        padding: "9px 16px",
        color: "#FCFCFA",
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "inherit",
        cursor: "pointer",
      }}
    >
      <Plus size={13} weight="bold" />
      {label}
    </button>
  );
}
