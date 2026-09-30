import { postAuthDestination } from "../../../shared/lib/onboarding-store";
import { setCurrentUser } from "../../../shared/lib/session";

import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  AuthShell,
  NexusMark,
  TextField,
  PrimaryButton,
  PageLoader,
  Spinner,
  C,
  APP_NAME,
} from "../../../shared/ui/kit";
import { Key, SignIn, CaretLeft, GoogleLogo, WindowsLogo, AppleLogo } from "@phosphor-icons/react";
import {
  authErrorMessage,
  OAUTH_PROVIDERS,
  oauthRedirect,
  supabase,
  supabaseReady,
} from "../../../shared/lib/supabase";

// ── NOTION-STYLE LOGIN ────────────────────────────────────────────────────────
// One identifier field that accepts a school email OR a student reg number.
// School emails on an SSO domain flip the button to "Continue with SSO" and
// hand off to the school's identity provider (staff route). Everyone else
// continues to a password step, verified against Supabase Auth. Social tiles
// start the real OAuth flow. Every button carries a loading state, and any
// operation that drags escalates to the full-page loader.

type Step = "identifier" | "password";

// Domains configured for SAML SSO in the demo. Replace with a real lookup.
const SSO_DOMAINS = ["school.edu.ng", "staff.school.edu.ng"];
// The one domain the demo IdP actually accepts; others show the
// "not configured" error from the reference.
const SSO_ACTIVE = "school.edu.ng";

const EMAIL_RE = /^\S+@\S+\.\S+$/;
// Reg numbers like "NEX/2024/0134", "SC2024-0134", "24987" — 4+ chars with a digit.
const REG_RE = /^(?=[\w/-]{4,}$)(?=.*\d)[\w/-]+$/;

const ssoDomainOf = (id: string) => {
  if (!EMAIL_RE.test(id)) return null;
  const domain = id.split("@")[1]?.toLowerCase() ?? "";
  return SSO_DOMAINS.includes(domain) ? domain : null;
};

export default function Login() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("identifier");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [identifierBusy, setIdentifierBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [providerBusy, setProviderBusy] = useState<string | null>(null);

  // Simulated latency only for the fake SSO demo path; real Supabase calls
  // need none. In dev you can append ?slow=<ms> to preview the loaders.
  const SIM_MS = import.meta.env.DEV
    ? Math.min(Number(new URLSearchParams(window.location.search).get("slow")) || 700, 30000)
    : 700;

  // Slow-watch: escalate to the full-page loader if an operation drags on.
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
  // Clear the slow-watch timer if the component unmounts mid-flight.
  useEffect(() => () => window.clearTimeout(slowTimer.current), []);

  const busy = identifierBusy || passwordBusy || providerBusy != null;

  const finish = (who?: { name?: string; email?: string }) => {
    if (who?.name || who?.email) {
      setCurrentUser({ name: who?.name ?? "", email: who?.email ?? "", school: "", role: "" });
    }
    endSlowWatch();
    setIdentifierBusy(false);
    setPasswordBusy(false);
    setProviderBusy(null);
    // Route by THIS account's setup state: brand-new accounts land in the
    // school-setup wizard; completed accounts go straight to the dashboard.
    navigate(postAuthDestination((who?.email ?? identifier).toLowerCase()));
  };

  const submitIdentifier = () => {
    const id = identifier.trim();
    if (!id) {
      setError("Enter your school email or registration number.");
      return;
    }
    if (!EMAIL_RE.test(id) && !REG_RE.test(id)) {
      setError("That doesn't look like an email or a reg number.");
      return;
    }
    setError(undefined);
    setIdentifierBusy(true);
    const domain = ssoDomainOf(id);
    if (domain) {
      beginSlowWatch([
        "Redirecting to your school's sign-in…",
        "Contacting your school's identity provider…",
        "Still trying — the network is slow…",
      ]);
      window.setTimeout(() => {
        endSlowWatch();
        setIdentifierBusy(false);
        // TODO: hand off to the school's SAML/OIDC provider.
        if (domain === SSO_ACTIVE) {
          finish({ email: id });
        } else {
          setError("This email is not configured for SSO. Please contact your administrator.");
        }
      }, SIM_MS);
      return;
    }
    // Plain email/reg number → password step (no network needed to show it).
    setIdentifierBusy(false);
    setStep("password");
  };

  const submitPassword = async () => {
    if (password.length < 6) {
      setError("Passwords are at least 6 characters.");
      return;
    }
    setError(undefined);
    setPasswordBusy(true);
    beginSlowWatch(["Signing you in…", "Reaching the servers…", "Still trying — the network is slow…"]);
    if (!supabaseReady) {
      // No credentials configured — demo fallback so the flow still completes.
      window.setTimeout(() => finish({ email: identifier }), SIM_MS);
      return;
    }
    if (!EMAIL_RE.test(identifier.trim())) {
      // Live auth is email+password; reg numbers are a demo-only path.
      endSlowWatch();
      setPasswordBusy(false);
      setError("Sign in with your school email — reg numbers work once your school enables SSO.");
      return;
    }
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email: identifier,
      password,
    });
    if (err) {
      endSlowWatch();
      setPasswordBusy(false);
      setError(authErrorMessage(err));
      return;
    }
    const meta = data.user?.user_metadata ?? {};
    finish({
      name: (meta.full_name as string) || (meta.name as string) || "",
      email: data.user?.email ?? identifier,
    });
  };

  const connectWithProvider = async (provider: string, label: string) => {
    if (busy) return;
    setError(undefined);
    setProviderBusy(provider);
    beginSlowWatch([`Contacting ${label}…`, "Almost there…", "Still trying — the network is slow…"]);
    const known = OAUTH_PROVIDERS.find((p) => p.id === provider);
    if (!supabaseReady || !known) {
      // Demo fallback when Supabase isn't configured yet.
      window.setTimeout(() => finish(), SIM_MS);
      return;
    }
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: known.id,
      options: { redirectTo: oauthRedirect() },
    });
    if (err) {
      endSlowWatch();
      setProviderBusy(null);
      setError(authErrorMessage(err));
    }
    // On success the browser redirects to the provider — nothing else to do.
  };

  const at = (s: Step) => step === s;

  return (
    <AuthShell>
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
          Your exam workspace.
        </h1>
        <p
          className="nx-fade-up"
          style={{ textAlign: "center", fontSize: 22, fontWeight: 600, color: C.muted, margin: "4px 0 34px", animationDelay: "120ms" }}
        >
          Log in to your {APP_NAME} account
        </p>

        {/* ── STEP: IDENTIFIER (email / reg number / SSO) ──────────────── */}
        {at("identifier") && (
          <form
            key="identifier"
            className="nx-fade-up"
            onSubmit={(e) => {
              e.preventDefault();
              submitIdentifier();
            }}
            noValidate
          >
            <TextField
              label="Email or Reg number"
              name="identifier"
              value={identifier}
              onChange={(v) => {
                setIdentifier(v);
                if (error) setError(undefined);
              }}
              placeholder="Email, reg number…"
              autoComplete="username"
              error={error}
              clearable
            />
            <p style={{ fontSize: 13, color: C.faint, margin: "8px 2px 22px" }}>
              Students can use their school email or reg number — staff use their school email
            </p>
            <PrimaryButton type="submit" full loading={identifierBusy}>
              {identifierBusy
                ? ssoDomainOf(identifier)
                  ? "Connecting…"
                  : "Checking…"
                : ssoDomainOf(identifier)
                  ? "Continue with SSO"
                  : "Continue"}
            </PrimaryButton>

            <Divider />

            <ProviderTiles
              busy={providerBusy}
              disabled={busy}
              onProvider={connectWithProvider}
              onPasskey={() => connectWithProvider("passkey", "your passkey")}
              onSSO={() => {
                if (!identifier.trim()) {
                  setError("Enter your school email first, then continue with SSO.");
                  return;
                }
                submitIdentifier();
              }}
            />
          </form>
        )}

        {/* ── STEP: PASSWORD ───────────────────────────────────────────── */}
        {at("password") && (
          <form
            key="password"
            className="nx-fade-up"
            onSubmit={(e) => {
              e.preventDefault();
              submitPassword();
            }}
            noValidate
          >
            <TextField
              label="Email or Reg number"
              name="identifier"
              value={identifier}
              onChange={(v) => setIdentifier(v)}
              autoComplete="username"
              clearable
            />
            <div style={{ height: 14 }} />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={password}
              onChange={(v) => {
                setPassword(v);
                if (error) setError(undefined);
              }}
              placeholder="Enter your password"
              autoComplete="current-password"
              error={error}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                margin: "10px 2px 22px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setError(undefined);
                  setPassword("");
                  setStep("identifier");
                }}
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
              <Link
                to="/forgot-password"
                style={{ fontSize: 13.5, fontWeight: 500, color: C.green, textDecoration: "none" }}
              >
                Forgot password?
              </Link>
            </div>
            <PrimaryButton type="submit" full loading={passwordBusy}>
              {passwordBusy ? "Signing in…" : "Continue"}
            </PrimaryButton>
          </form>
        )}

        {at("password") && <div style={{ height: 26 }} />}
        {at("password") && (
          <ProviderTiles
            busy={providerBusy}
            disabled={busy}
            onProvider={connectWithProvider}
            onPasskey={() => connectWithProvider("passkey", "your passkey")}
            onSSO={() => {
              setStep("identifier");
              setError("Enter your school email first, then continue with SSO.");
            }}
          />
        )}

        <p style={{ textAlign: "center", fontSize: 13, color: C.faint, marginTop: 26, lineHeight: 1.6 }}>
          By continuing, you acknowledge that you understand and agree to the{" "}
          <span style={{ textDecoration: "underline" }}>Terms &amp; Conditions</span> and{" "}
          <span style={{ textDecoration: "underline" }}>Privacy Policy</span>
        </p>
        <p style={{ textAlign: "center", fontSize: 13, color: C.muted, marginTop: 22 }}>
          New to {APP_NAME}?{" "}
          <Link to="/signup" style={{ color: C.green, fontWeight: 600, textDecoration: "none" }}>
            Create an account
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

function Divider() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        color: C.faint,
        fontSize: 12.5,
        margin: "24px 0 20px",
      }}
    >
      <span style={{ flex: 1, height: 1, background: C.lineSoft }} />
      or continue with
      <span style={{ flex: 1, height: 1, background: C.lineSoft }} />
    </div>
  );
}

// Icon-above-label tiles, like the Notion reference: three providers, then
// Passkey + SSO centered underneath. Tiles rise in one after another.
function ProviderTiles({
  busy,
  disabled,
  onProvider,
  onPasskey,
  onSSO,
}: {
  busy: string | null;
  disabled: boolean;
  onProvider: (provider: string, label: string) => void;
  onPasskey: () => void;
  onSSO: () => void;
}) {
  return (
    <div>
      <style>{"@media (max-width: 640px){ .nexus-tiles{ grid-template-columns: 1fr !important; } }"}</style>
      <div className="nexus-tiles" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {OAUTH_PROVIDERS.map((p, i) => (
          <Tile
            key={p.id}
            label={p.label}
            loading={busy === p.id}
            disabled={disabled}
            onClick={() => onProvider(p.id, p.label)}
            delay={i * 60}
          >
            {p.id === "google" ? <GoogleLogo size={17} /> : p.id === "azure" ? <WindowsLogo size={16} /> : <AppleLogo size={17} />}
          </Tile>
        ))}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          maxWidth: 300,
          margin: "12px auto 0",
        }}
      >
        <Tile
          label="Passkey"
          loading={busy === "passkey"}
          disabled={disabled}
          onClick={onPasskey}
          delay={180}
        >
          <PasskeyGlyph />
        </Tile>
        <Tile label="SSO" loading={busy === "sso"} disabled={disabled} onClick={onSSO} delay={240}>
          <SSOGlyph />
        </Tile>
      </div>
    </div>
  );
}

function Tile({
  label,
  loading,
  disabled,
  onClick,
  delay = 0,
  children,
}: {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="nx-fade-up"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        background: C.white,
        border: `1px solid ${C.line}`,
        borderRadius: 14,
        padding: "14px 10px 12px",
        color: C.ink,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "inherit",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.6 : 1,
        transition: "background 0.2s ease, opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease",
        animationDelay: `${delay}ms`,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.background = "rgba(0,0,0,0.035)";
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(30,35,20,0.08)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = C.white;
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {loading ? <Spinner size={17} color={C.green} /> : children}
      <span>{label}</span>
    </button>
  );
}

function PasskeyGlyph() {
  return <Key size={17} aria-hidden />;
}

function SSOGlyph() {
  return <SignIn size={17} aria-hidden />;
}
