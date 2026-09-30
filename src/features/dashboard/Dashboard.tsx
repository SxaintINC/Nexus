// ── NEXUS HOME ────────────────────────────────────────────────────────────────
// Post-auth analytics dashboard, modeled on the logged-in admin console from
// the reference: top bar with the session/term pill, a Billing Plan chip, a
// "Hi … / Logged In As" block with LOG OUT, a sectioned sidebar that now
// includes the Academic section (attendance, population, staff attendance),
// and panels for academic performance (trend + optional trend line), grade
// donut, subject ranking, attendance, fee collection, population, upcoming
// exams and live activity. All numbers come from the seeded demo dataset
// (lib/demo-data.ts), which derives from the school's onboarding data.

// The router mounts this feature through the barrel: src/app imports
// `Dashboard` from features/dashboard/page.tsx. Chart primitives live in
// components/, seeded data in lib/.

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarBlank,
  CalendarCheck,
  CalendarDots,
  ChartBar,
  ChartPie,
  CaretRight,
  CaretUpDown,
  ChalkboardTeacher,
  ClipboardText,
  Clock,
  DownloadSimple,
  FileText,
  GearSix,
  GraduationCap,
  List,
  ListChecks,
  Lightbulb,
  MagnifyingGlass,
  Plus,
  SignOut,
  SquaresFour,
  Stack,
  TrendUp,
  Users,
  UsersThree,
  Wallet,
  X,
} from "@phosphor-icons/react";

import { C, APP_NAME, Checkbox, NexusMark, PrimaryButton, SERIF, StatusPill, Spinner } from "../../shared/ui/kit";
import { clearCurrentUser, currentUser, ensureSession, firstName, greeting } from "../../shared/lib/session";
import {
  defaultOnboarding,
  loadOnboarding,
  markOnboardingDone,
} from "../../shared/lib/onboarding-store";
import { resumeSession, supabase, supabaseReady } from "../../shared/lib/supabase";
import { buildDashboardData, type Seg } from "./lib/demo-data";
import { Donut, HBars, MiniBars, Sparkline, TrendChart } from "./components/charts";

const FONT = "Inter, system-ui, -apple-system, sans-serif";

const NAV_SECTIONS: { title: string; items: { icon: typeof SquaresFour; label: string; active?: boolean }[] }[] = [
  {
    title: "Main menu",
    items: [
      { icon: SquaresFour, label: "Dashboard", active: true },
      { icon: FileText, label: "Exams" },
      { icon: ClipboardText, label: "Question bank" },
      { icon: Users, label: "Students" },
    ],
  },
  {
    title: "Academic",
    items: [
      { icon: CalendarCheck, label: "Attendance" },
      { icon: UsersThree, label: "Student population" },
      { icon: ListChecks, label: "Staff attendance" },
    ],
  },
  {
    title: "Management",
    items: [
      { icon: GraduationCap, label: "Staff" },
      { icon: ChalkboardTeacher, label: "Classes" },
      { icon: Wallet, label: "Fees" },
      { icon: CalendarDots, label: "Calendar" },
    ],
  },
  {
    title: "Insights",
    items: [
      { icon: ChartPie, label: "Reports" },
      { icon: GearSix, label: "Settings" },
    ],
  },
];

// ── SMALL PIECES ──────────────────────────────────────────────────────────────

// ── COUNT-UP ─────────────────────────────────────────────────────────────────
// Numbers ease up from zero on mount — makes the stats feel alive without
// being noisy. Respects the reduced-motion guard via its own check.

function useCountUp(target: number, duration = 900) {
  const reduced = useMemo(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  // Start at the final value when the user prefers reduced motion.
  const [v, setV] = useState(() => (reduced ? target : 0));
  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduced]);
  return v;
}

// "96" → animates 0→96; "70%" → 0→70 + "%"; "1,284" → keeps the comma.
function AnimatedValue({ text }: { text: string }) {
  const m = text.match(/^([\d,]+(?:\.\d+)?)(.*)$/);
  const target = m ? parseFloat(m[1].replace(/,/g, "")) : NaN;
  const v = useCountUp(Number.isNaN(target) ? 0 : target);
  if (!m || Number.isNaN(target)) return <>{text}</>;
  const decimals = m[1].includes(".") ? m[1].split(".")[1].length : 0;
  const shown = m[1].includes(",") ? Math.round(v).toLocaleString() : v.toFixed(decimals);
  return <>{shown}{m[2]}</>;
}

function Delta({ v }: { v: number }) {
  const up = v >= 0;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: 12,
        fontWeight: 600,
        color: up ? C.green : C.red,
        background: up ? C.greenDarkWash : C.redWash,
        borderRadius: 999,
        padding: "2px 8px",
      }}
    >
      {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {up ? "+" : ""}
      {v}%
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  delta,
  spark,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub: string;
  delta: number;
  spark: number[];
  icon: typeof Users;
}) {
  return (
    <div
      className="nx-fade-up nx-lift"
      style={{
        background: C.card,
        border: `1px solid ${C.lineSoft}`,
        borderRadius: 18,
        padding: "18px 20px 14px",
        minWidth: 0,
        boxShadow: "0 10px 28px rgba(30,35,20,0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 10,
            background: C.greenWash,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={15} color={C.greenDark} />
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.7px", textTransform: "uppercase", color: C.muted }}>
          {label}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10, marginTop: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: SERIF,
              fontSize: 30,
              fontWeight: 500,
              letterSpacing: "-0.5px",
              color: C.ink,
              lineHeight: 1.05,
              whiteSpace: "nowrap",
            }}
          >
            <AnimatedValue text={value} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 7 }}>
            <Delta v={delta} />
            <span style={{ fontSize: 11.5, color: C.faint, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sub}</span>
          </div>
        </div>
        <Sparkline data={spark} />
      </div>
    </div>
  );
}

function Panel({
  title,
  icon,
  action,
  children,
  pad,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  pad?: boolean;
}) {
  return (
    <div
      className="nx-fade-up nx-lift"
      style={{
        background: C.card,
        border: `1px solid ${C.lineSoft}`,
        borderRadius: 20,
        padding: pad === false ? 0 : "22px 24px",
        minWidth: 0,
        boxShadow: "0 14px 34px rgba(30,35,20,0.04)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18, padding: pad === false ? "20px 22px 0" : undefined }}>
        {icon}
        <h3 style={{ fontFamily: SERIF, fontSize: 17.5, fontWeight: 500, letterSpacing: "-0.3px", margin: 0, color: C.ink }}>
          {title}
        </h3>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>{action}</div>
      </div>
      {children}
    </div>
  );
}

function Segmented<T extends string>({ options, value, onChange }: { options: { key: T; label: string }[]; value: T; onChange: (k: T) => void }) {
  return (
    <div style={{ display: "inline-flex", background: C.blob, borderRadius: 999, padding: 3 }}>
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          style={{
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 12.5,
            fontWeight: value === o.key ? 650 : 500,
            color: value === o.key ? C.ink : C.muted,
            background: value === o.key ? C.white : "transparent",
            borderRadius: 999,
            padding: "6px 14px",
            boxShadow: value === o.key ? "0 2px 8px rgba(30,35,20,0.10)" : "none",
            transition: "all 0.2s ease",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// Stacked attendance columns — present (green) / late (amber) / absent (red)
// per weekday, like the attendance chart in the reference.
function AttendanceChart({ week }: { week: { day: string; present: number; late: number; absent: number }[] }) {
  const max = Math.max(...week.map((w) => w.present + w.late + w.absent)) || 1;
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 18, height: 150 }}>
        {week.map((w) => {
          const total = w.present + w.late + w.absent;
          return (
            <div key={w.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, height: "100%", justifyContent: "flex-end" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.muted }}>
                {Math.round((w.present / Math.max(1, total)) * 100)}%
              </span>
              <div
                className="nx-bar-y"
                style={{
                  width: "100%",
                  maxWidth: 42,
                  height: `${(total / max) * 100}%`,
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: "8px 8px 3px 3px",
                  overflow: "hidden",
                }}
              >
                <div style={{ flex: Math.max(w.absent, 0.001), background: C.redWash, minHeight: 2 }} />
                <div style={{ flex: Math.max(w.late, 0.001), background: C.amberWash, minHeight: 2 }} />
                <div style={{ flex: w.present, background: C.green }} />
              </div>
              <span style={{ fontSize: 11, color: C.faint }}>{w.day}</span>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 14, fontSize: 12, color: C.muted, flexWrap: "wrap" }}>
        {[
          { label: "Present", color: C.green },
          { label: "Late", color: C.amber },
          { label: "Absent", color: C.red },
        ].map((l) => (
          <span key={l.label} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 3, background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// Class-by-class headcount with a staff chip — the "Student Population" screen
// from the reference, condensed into a dashboard panel.
function PopulationRows({ population }: { population: { name: string; students: number; staff: number }[] }) {
  const total = population.reduce((s, p) => s + p.students, 0) || 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
      {population.map((p) => (
        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.ink, width: 64, flexShrink: 0 }}>{p.name}</span>
          <div style={{ flex: 1, height: 9, borderRadius: 999, background: C.blob, overflow: "hidden" }}>
            <div
              className="nx-bar-x"
              style={{
                width: `${(p.students / total) * 100}%`,
                height: "100%",
                borderRadius: 999,
                background: `linear-gradient(90deg, ${C.green}, ${C.greenBright})`,
              }}
            />
          </div>
          <b style={{ fontSize: 13, minWidth: 26, textAlign: "right" }}>{p.students}</b>
          <StatusPill tone="violet">{p.staff} staff</StatusPill>
        </div>
      ))}
    </div>
  );
}

function SwitcherItem({
  icon: Icon,
  label,
  hint,
  disabled,
  onClick,
}: {
  icon: typeof GearSix;
  label: string;
  hint?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 10px",
        borderRadius: 10,
        border: "none",
        background: "transparent",
        color: disabled ? C.faint : C.ink,
        fontSize: 13.5,
        fontWeight: 500,
        fontFamily: "inherit",
        cursor: disabled ? "default" : "pointer",
        textAlign: "left",
        transition: "background 0.15s ease",
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = "rgba(0,0,0,0.045)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <Icon size={16} color={disabled ? C.faint : C.muted} />
      <span style={{ flex: 1, minWidth: 0 }}>
        {label}
        {hint && <span style={{ display: "block", fontSize: 11, color: C.faint, marginTop: 1 }}>{hint}</span>}
      </span>
    </button>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────

export default function Home() {
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [seg, setSeg] = useState<Seg>("monthly");
  const [showTrendLine, setShowTrendLine] = useState(false);
  // Branded splash while the session + setup state resolve.
  const [checking, setChecking] = useState(true);

  // Demo fallback identity — the console always shows a logged-in admin, like
  // the reference. Replace with a real auth guard when the API exists.
  const user = ensureSession();
  const d = useMemo(() => buildDashboardData(currentUser()?.email?.toLowerCase() ?? ""), []);

  useEffect(() => {
    let alive = true;
    (async () => {
      // 1. Sync a Supabase session (OAuth redirect / remembered login) into the
      //    app identity, then re-read who we are.
      try {
        await resumeSession();
      } catch {
        /* offline — the local identity is enough */
      }
      if (!alive) return;
      const email = currentUser()?.email?.toLowerCase() ?? "";

      // 2. Any real account that hasn't completed school setup is routed to
      //    the wizard first — dashboard is for set-up schools only.
      if (email) {
        let needsSetup = !loadOnboarding(email)?.done;
        if (supabaseReady) {
          try {
            // Guard against a hanging network: 2.5s budget, then fall back
            // to the local answer.
            const auth = await Promise.race([
              supabase.auth.getUser(),
              new Promise<null>((r) => window.setTimeout(() => r(null), 2500)),
            ]);
            if (!alive) return;
            const uidFromAuth = auth?.data?.user?.id;
            if (uidFromAuth) {
              const prof = await Promise.race([
                supabase.from("profiles").select("onboarding_done").eq("id", uidFromAuth).maybeSingle(),
                new Promise<null>((r) => window.setTimeout(() => r(null), 2500)),
              ]);
              if (!alive) return;
              if (prof?.data && typeof prof.data.onboarding_done === "boolean") {
                needsSetup = !prof.data.onboarding_done;
                if (!needsSetup && !loadOnboarding(email)?.done) {
                  // Keep the local store in agreement with the server.
                  markOnboardingDone(email, loadOnboarding(email) ?? defaultOnboarding());
                }
              }
            }
          } catch {
            /* local state decides */
          }
        }
        if (!alive) return;
        if (needsSetup) {
          navigate("/onboarding", { replace: true });
          return;
        }
      }
      setChecking(false);
    })();
    return () => {
      alive = false;
    };
  }, [navigate]);

  const school = user.school?.trim() || "Your school";
  const fullName = user.name?.trim() || user.email?.split("@")[0] || "Admin";
  const role = user.role?.trim() || "Super Administrator";
  const trend = d.buildTrend(seg);

  const logout = () => {
    clearCurrentUser();
    if (supabaseReady) void supabase.auth.signOut().catch(() => {});
    navigate("/login");
  };

  // Resolve guard first: show a branded splash while the session + setup
  // state resolve (and while redirecting to onboarding).
  if (checking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: C.paper,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        }}
      >
        <div className="nx-pop">
          <NexusMark size={44} />
        </div>
        <Spinner size={22} color={C.green} />
      </div>
    );
  }

  const initials = (user.name || user.email || "N")
    .split(/\s+/)
    .map((w) => w.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const now = new Date();
  const today = `Today, ${now.getDate()} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][now.getMonth()]}`;

  const spark = (seed: number) => trend.map((p, i) => 40 + ((i * (seed + 3)) % 9) + (p.score - 60) / 2);

  const sidebar = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "24px 16px 20px", overflowY: "auto" }}>
      {/* School switcher — brand tile + school name + role + up/down arrows */}
      <div style={{ padding: "0 4px 16px", position: "relative" }}>
        <button
          onClick={() => setSwitcherOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={switcherOpen}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 11,
            padding: "9px 10px",
            borderRadius: 14,
            border: "none",
            background: switcherOpen ? "rgba(0,0,0,0.05)" : "transparent",
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "left",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => {
            if (!switcherOpen) e.currentTarget.style.background = "rgba(0,0,0,0.035)";
          }}
          onMouseLeave={(e) => {
            if (!switcherOpen) e.currentTarget.style.background = "transparent";
          }}
        >
          <span
            aria-hidden
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              background: C.ink,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <NexusMark size={23} color={C.paper} />
          </span>
          <span style={{ minWidth: 0, flex: 1 }}>
            <span
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 700,
                color: C.ink,
                lineHeight: 1.25,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {school}
            </span>
            <span
              style={{
                display: "block",
                fontSize: 11.5,
                color: C.muted,
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {role}
            </span>
          </span>
          <CaretUpDown size={13} weight="bold" color={C.faint} style={{ flexShrink: 0 }} />
        </button>

        {switcherOpen && (
          <>
            <div onClick={() => setSwitcherOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 60 }} />
            <div
              role="menu"
              className="nx-menu"
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                left: 0,
                right: 0,
                zIndex: 61,
                background: C.white,
                border: `1px solid ${C.lineSoft}`,
                borderRadius: 16,
                boxShadow: "0 18px 44px rgba(30,35,20,0.16)",
                padding: 8,
              }}
            >
              <div style={{ padding: "8px 10px 10px", borderBottom: `1px solid ${C.lineSoft}`, marginBottom: 6 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: C.ink }}>{school}</div>
                <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>
                  {d.session} · {d.currentTerm} · <span style={{ color: C.amber, fontWeight: 700 }}>Trial</span>
                </div>
              </div>
              <SwitcherItem icon={GearSix} label="School settings" onClick={() => setSwitcherOpen(false)} />
              <SwitcherItem
                icon={SquaresFour}
                label="Switch school"
                hint="Only one school on Trial"
                disabled
              />
              <div style={{ height: 1, background: C.lineSoft, margin: "6px 4px" }} />
              <SwitcherItem icon={SignOut} label="Log out" onClick={logout} />
            </div>
          </>
        )}
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: "1.2px",
                textTransform: "uppercase",
                color: C.faint,
                padding: "0 12px 8px",
              }}
            >
              {section.title}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {section.items.map(({ icon: Icon, label, active }) => (
                <button
                  key={label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "none",
                    background: active ? C.greenWash : "transparent",
                    color: active ? C.greenDark : C.muted,
                    fontSize: 13.5,
                    fontWeight: active ? 650 : 500,
                    fontFamily: "inherit",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = "rgba(0,0,0,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Icon size={16} weight={active ? "fill" : "regular"} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div
        style={{
          marginTop: 14,
          borderTop: `1px solid ${C.lineSoft}`,
          paddingTop: 14,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          aria-hidden
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: C.ink,
            color: C.paper,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {fullName}
          </div>
          <div style={{ fontSize: 11.5, color: C.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {user.email || "Sign in to sync"}
          </div>
        </div>
        <button
          onClick={logout}
          aria-label="Log out"
          title="Log out"
          style={{ border: "none", background: "transparent", color: C.muted, cursor: "pointer", padding: 7, borderRadius: 10, display: "flex" }}
        >
          <SignOut size={15} />
        </button>
      </div>

      {/* Powered by — Fikri-style app attribution footer */}
      <div
        style={{
          margin: "12px 10px 0",
          borderTop: `1px solid ${C.lineSoft}`,
          padding: "12px 0 0",
          display: "flex",
          alignItems: "center",
          gap: 7,
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.1px", textTransform: "uppercase", color: C.faint }}>Powered by</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
          <NexusMark size={14} color={C.ink} />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.2px", color: C.ink }}>{APP_NAME}</span>
        </span>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.paper, fontFamily: FONT, color: C.ink, display: "flex" }}>
      <aside className="home-sidebar" style={{ width: 244, flexShrink: 0, borderRight: `1px solid ${C.lineSoft}`, background: C.paper, position: "sticky", top: 0, height: "100vh" }}>
        {sidebar}
      </aside>

      {navOpen && (
        <div onClick={() => setNavOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(22,21,15,0.35)", zIndex: 40 }}>
          <aside
            onClick={(e) => e.stopPropagation()}
            style={{ position: "fixed", top: 0, left: 0, bottom: 0, width: 268, background: C.paper, borderRight: `1px solid ${C.lineSoft}`, zIndex: 41 }}
          >
            <button
              onClick={() => setNavOpen(false)}
              aria-label="Close menu"
              style={{ position: "absolute", top: 14, right: 14, border: "none", background: "transparent", cursor: "pointer", padding: 6, display: "flex", zIndex: 1 }}
            >
              <X size={18} color={C.muted} />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Top bar — term pill, billing chip, logged-in-as, log out */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,
            background: "rgba(244,243,238,0.85)",
            backdropFilter: "blur(10px)",
            borderBottom: `1px solid ${C.lineSoft}`,
            padding: "13px 26px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexWrap: "wrap",
            rowGap: 8,
          }}
        >
          <button className="home-menu-btn" onClick={() => setNavOpen(true)} aria-label="Open menu" style={{ display: "none", border: "none", background: "transparent", cursor: "pointer", padding: 6 }}>
            <List size={20} color={C.ink} />
          </button>

          <div
            className="home-search"
            style={{
              flex: 1,
              maxWidth: 380,
              display: "flex",
              alignItems: "center",
              gap: 9,
              background: C.card,
              border: `1px solid ${C.lineSoft}`,
              borderRadius: 999,
              padding: "9px 16px",
              color: C.faint,
            }}
          >
            <MagnifyingGlass size={15} />
            <input
              placeholder="Search exams, students, classes…"
              style={{ border: "none", outline: "none", background: "transparent", font: "inherit", fontSize: 13.5, color: C.ink, width: "100%" }}
            />
          </div>

          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <button
              aria-label="Notifications"
              style={{ position: "relative", border: `1px solid ${C.lineSoft}`, background: C.card, width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <Bell size={16} color={C.ink} />
              <span style={{ position: "absolute", top: 8, right: 9, width: 7, height: 7, borderRadius: "50%", background: C.red, border: `1.5px solid ${C.card}` }} />
            </button>
            <PrimaryButton onClick={() => navigate("/")}>
              <Plus size={15} weight="bold" />
              New exam
            </PrimaryButton>
          </div>
        </header>

        {/* Content */}
        <main className="home-main" style={{ padding: "26px 26px 60px", minWidth: 0 }}>
          {/* Heading + actions */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
            <div>
              <h1 style={{ fontFamily: SERIF, fontSize: "clamp(25px, 3vw, 32px)", fontWeight: 500, letterSpacing: "-0.6px", margin: 0 }}>
                {greeting()}, {firstName()}.
              </h1>
              <p style={{ fontSize: 14, color: C.muted, margin: "7px 0 0" }}>
                Here's how {school} is doing this {d.currentTerm.toLowerCase()} — {d.session} session.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <button
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  background: C.card,
                  border: `1px solid ${C.lineSoft}`,
                  borderRadius: 999,
                  padding: "10px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  color: C.ink,
                  fontFamily: "inherit",
                  cursor: "pointer",
                }}
              >
                <DownloadSimple size={14} />
                Export CSV
              </button>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, color: C.muted, fontWeight: 500 }}>
                <CalendarBlank size={14} />
                {today}
              </span>
            </div>
          </div>

          {/* Stat cards — staff added, per the reference's people screens */}
          <div className="home-stats nx-fade-up" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(196px, 1fr))", gap: 13, marginBottom: 16, animationDelay: "80ms" }}>
            <StatCard label="Students" value={String(d.stats.students.value)} sub="vs last term" delta={d.stats.students.delta} spark={spark(1)} icon={Users} />
            <StatCard label="Avg score" value={`${d.stats.avgScore.value}%`} sub="vs last term" delta={d.stats.avgScore.delta} spark={spark(2)} icon={TrendUp} />
            <StatCard label="Submissions" value={d.stats.submissions.value.toLocaleString()} sub="this term" delta={d.stats.submissions.delta} spark={spark(3)} icon={Stack} />
            <StatCard label="Staff" value={String(d.staffCount)} sub="on duty this week" delta={3} spark={spark(5)} icon={GraduationCap} />
            <StatCard label="Fee collection" value={`${d.stats.feeRate.value}%`} sub={`₦${(d.collected / 1_000_000).toFixed(1)}m of ₦${(d.expected / 1_000_000).toFixed(1)}m`} delta={d.stats.feeRate.delta} spark={spark(4)} icon={Wallet} />
          </div>

          {/* Trend + ranking */}
          <div className="home-row2 nx-fade-up" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.9fr) minmax(0, 1fr)", gap: 14, marginBottom: 14, animationDelay: "160ms" }}>
            <Panel
              title="School academic performance"
              icon={<ChartBar size={16} color={C.greenDark} />}
              action={<Segmented value={seg} onChange={setSeg} options={[{ key: "daily" as Seg, label: "Daily" }, { key: "weekly" as Seg, label: "Weekly" }, { key: "monthly" as Seg, label: "Monthly" }]} />}
            >
              <div style={{ textAlign: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{school} — academic performance</div>
                <div style={{ fontSize: 12, color: C.faint, marginTop: 2 }}>{d.session} session</div>
              </div>
              <TrendChart points={trend} showTrendLine={showTrendLine} />
              {/* Show trend line — reference checkbox */}
              <div style={{ marginTop: 12 }}>
                <Checkbox checked={showTrendLine} onChange={setShowTrendLine}>
                  SHOW TREND LINE
                </Checkbox>
              </div>
            </Panel>

            <Panel title="Subject ranking" icon={<ClipboardText size={16} color={C.greenDark} />}>
              <HBars rows={d.subjectAvg} />
            </Panel>
          </div>

          {/* Attendance + donut + fees */}
          <div className="home-row3 nx-fade-up" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(0, 1fr) minmax(0, 1fr)", gap: 14, marginBottom: 14, animationDelay: "240ms" }}>
            <Panel title="Attendance this week" icon={<CalendarCheck size={16} color={C.greenDark} />}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
                <span style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 500, letterSpacing: "-0.4px" }}>{d.attendanceRate}%</span>
                <span style={{ fontSize: 12.5, color: C.faint }}>average across {d.stats.students.value} students</span>
              </div>
              <AttendanceChart week={d.attendanceWeek} />
            </Panel>

            <Panel title="Grade distribution" icon={<ChartPie size={16} color={C.greenDark} />}>
              <Donut
                data={d.gradeDist.map((g) => ({ label: g.grade, value: g.count, remark: g.remark }))}
                centerLabel={`${d.stats.avgScore.value}%`}
                centerSub="avg score"
              />
            </Panel>

            <Panel title="Fee collection" icon={<Wallet size={16} color={C.greenDark} />} action={<span style={{ fontSize: 12, color: C.faint }}>last 6 months</span>}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
                <span style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 500, letterSpacing: "-0.4px" }}>
                  ₦{(d.collected / 1_000_000).toFixed(1)}m
                </span>
                <span style={{ fontSize: 12.5, color: C.faint }}>of ₦{(d.expected / 1_000_000).toFixed(1)}m expected</span>
              </div>
              <MiniBars data={d.feeMonths} />
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 14, fontSize: 12.5, color: C.muted }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.amber }} />
                {Math.round((1 - d.collected / d.expected) * 100)}% outstanding — most from SS 1 arrears
              </div>
            </Panel>
          </div>

          {/* Exams + insight */}
          <div className="home-row4 nx-fade-up" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.9fr) minmax(0, 1fr)", gap: 14, marginBottom: 14, animationDelay: "320ms" }}>
            <Panel
              title="Upcoming exams"
              icon={<CalendarDots size={16} color={C.greenDark} />}
              pad={false}
              action={
                <button
                  onClick={() => navigate("/")}
                  style={{ border: "none", background: "transparent", color: C.greenDark, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3, fontFamily: "inherit", marginRight: 18 }}
                >
                  View all <CaretRight size={14} weight="bold" />
                </button>
              }
            >
              <div className="home-table" style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ textAlign: "left" }}>
                      {["Exam", "Class", "Date", "Time", "Students"].map((h) => (
                        <th
                          key={h}
                          style={{
                            fontSize: 10.5,
                            fontWeight: 700,
                            letterSpacing: "1px",
                            textTransform: "uppercase",
                            color: C.faint,
                            padding: "12px 22px",
                            borderBottom: `1px solid ${C.lineSoft}`,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {d.upcoming.map((e, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
                        <td style={{ padding: "13px 22px", fontWeight: 600, whiteSpace: "nowrap" }}>
                          {e.title}
                        </td>
                        <td style={{ padding: "13px 22px", color: C.muted, whiteSpace: "nowrap" }}>{e.klass}</td>
                        <td style={{ padding: "13px 22px", color: C.muted, whiteSpace: "nowrap" }}>
                          {e.day}, {e.mon} · 16
                        </td>
                        <td style={{ padding: "13px 22px", color: C.muted, whiteSpace: "nowrap" }}>
                          {e.time} · {e.duration}
                        </td>
                        <td style={{ padding: "13px 22px" }}>
                          <StatusPill tone={i % 3 === 0 ? "green" : i % 3 === 1 ? "violet" : "amber"}>{e.students} students</StatusPill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>

            <Panel title="This term at a glance" icon={<Lightbulb size={16} color={C.amber} weight="fill" />}>
              <div
                style={{
                  background: C.amberWash,
                  borderRadius: 14,
                  padding: "16px 16px",
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: "#6B5314",
                  fontWeight: 500,
                  marginBottom: 14,
                }}
              >
                {d.insight}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {d.classAvgs.slice(0, 3).map((c) => (
                  <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <span style={{ color: C.muted, flex: 1 }}>{c.name}</span>
                    <div style={{ width: 84, height: 6, borderRadius: 999, background: C.blob, overflow: "hidden" }}>
                      <div style={{ width: `${c.avg}%`, height: "100%", background: C.green, borderRadius: 999 }} />
                    </div>
                    <b style={{ minWidth: 32, textAlign: "right" }}>{c.avg}%</b>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* Population + activity */}
          <div className="home-row5 nx-fade-up" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.9fr)", gap: 14, animationDelay: "400ms" }}>
            <Panel
              title="Student population"
              icon={<UsersThree size={16} color={C.greenDark} />}
              action={<span style={{ fontSize: 12, color: C.faint }}>{d.staffCount} staff</span>}
            >
              <PopulationRows population={d.population} />
            </Panel>

            <Panel title="Recent activity" icon={<Clock size={16} color={C.greenDark} />}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {d.activity.map((a, i) => {
                  const tone = a.kind === "payment" ? "amber" : a.kind === "grade" ? "green" : a.kind === "exam" ? "violet" : "green";
                  const icons = { exam: FileText, grade: TrendUp, payment: Wallet, student: Users, question: BookOpen };
                  const Icon = icons[a.kind];
                  return (
                    <div key={i} style={{ display: "flex", gap: 11, padding: "9px 2px", alignItems: "flex-start" }}>
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: tone === "amber" ? C.amberWash : tone === "violet" ? C.violetWash : C.greenWash,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={13} color={tone === "amber" ? C.amber : tone === "violet" ? C.violet : C.greenDark} />
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: C.ink, lineHeight: 1.45 }}>{a.text}</div>
                        <div style={{ fontSize: 11.5, color: C.faint, marginTop: 2 }}>{a.when}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => navigate("/onboarding")}
                style={{
                  marginTop: "auto",
                  alignSelf: "flex-start",
                  border: "none",
                  background: "transparent",
                  color: C.greenDark,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontFamily: "inherit",
                  padding: "10px 0 0",
                }}
              >
                Edit school setup <CaretRight size={14} weight="bold" />
              </button>
            </Panel>
          </div>
        </main>
      </div>

      <style>{`
        @media (max-width: 1180px) {
          .home-row2, .home-row4, .home-row5 { grid-template-columns: 1fr !important; }
          .home-row3 { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 640px) {
          .home-search { display: none !important; }
        }
        @media (max-width: 900px) {
          .home-sidebar { display: none; }
          .home-menu-btn { display: flex !important; }
          .home-row3 { grid-template-columns: 1fr !important; }
          .home-main { padding: 20px 16px 48px !important; }
        }
        @media (max-width: 560px) {
          .home-stats { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}


// ── FEATURE BARREL ────────────────────────────────────────────────────────────
// Re-exported for the src/app router; also lets sibling features reuse the
// seeded dataset without reaching into lib/ internals.
