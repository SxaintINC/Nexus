/* eslint-disable react-refresh/only-export-components -- design-kit files intentionally export tokens alongside components */
// ── AUTH DESIGN KIT ──────────────────────────────────────────────────────────
// Shared visual language for the authentication flow. Structure follows the
// stepped-form reference (top stepper, centered card, serif title + accent
// underline, 2-column fields, Previous/Next actions) while the surface styling
// follows the softer pastel reference: warm ivory canvas, borderless white
// cards with wide soft shadows, pill buttons with a black primary, pastel
// status chips, and a circle-check progress indicator.

import React from "react";
import {
  Check,
  X,
  Eye,
  EyeSlash,
  CaretLeft,
  CaretRight,
  CircleNotch,
  GoogleLogo,
  AppleLogo,
  WindowsLogo,
} from "@phosphor-icons/react";

export const C = {
  ink: "#16150F",
  paper: "#F4F3EE",
  card: "#FCFCFA",
  white: "#FFFFFF",
  green: "#5A7A3F",
  greenBright: "#6C8C4F",
  greenText: "#88A99A",
  greenWash: "#E4EDD9",
  blob: "#E9EAE0",
  line: "rgba(0,0,0,0.10)",
  lineSoft: "rgba(0,0,0,0.06)",
  muted: "rgba(0,0,0,0.52)",
  faint: "rgba(0,0,0,0.36)",
  stepIdle: "#E4E3DB",
  red: "#C05B5B",
  redWash: "#F9E3E3",
  amber: "#A8842C",
  amberWash: "#FAF0D7",
  greenDark: "#5A7A3F",
  greenDarkWash: "#E4EDD9",
  violet: "#7B6BB5",
  violetWash: "#ECE9F8",
  greenFg: "#F4F3EE",
} as const;

export const SERIF = "'Source Serif 4', 'Iowan Old Style', Georgia, serif";

// The one true product name. Change it here and it changes everywhere.
export const APP_NAME = "Nexus";

// ── LOGO ──────────────────────────────────────────────────────────────────────
// Nexus mark: a circular emblem of three arcs joined by three "people" dots.

export function NexusMark({ size = 30, color = C.ink }: { size?: number; color?: string }) {
  const R = 40;
  const CIRC = 2 * Math.PI * R;
  const gap = CIRC / 3 - 82; // three equal gaps between the arcs
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden>
      <circle
        cx="50"
        cy="50"
        r={R}
        stroke={color}
        strokeWidth="13"
        strokeLinecap="round"
        strokeDasharray={`${82} ${gap}`}
        transform="rotate(-58 50 50)"
      />
      <g fill={color}>
        <circle cx="50" cy="25" r="10.5" />
        <circle cx="28" cy="62.5" r="10.5" />
        <circle cx="72" cy="62.5" r="10.5" />
      </g>
    </svg>
  );
}

export function Logo({ color = C.ink, size = 20 }: { color?: string; size?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
      <NexusMark size={size * 1.55} color={color} />
      <span
        style={{
          fontSize: size + 2,
          fontWeight: 700,
          color,
          letterSpacing: "-0.6px",
          lineHeight: 1,
        }}
      >
        {APP_NAME}
      </span>
    </span>
  );
}

// ── SHELL ─────────────────────────────────────────────────────────────────────
// Single-column page: logo pinned top-left, soft sage blobs behind, centered
// content column. No split-screen brand panel.

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.paper,
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        color: C.ink,
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Decorative background blobs — soft sage shapes on the ivory canvas */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: 620,
          height: 620,
          borderRadius: "50%",
          background: C.blob,
          opacity: 0.8,
          top: -260,
          right: -180,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: 460,
          height: 460,
          borderRadius: "50%",
          background: C.blob,
          opacity: 0.6,
          bottom: -200,
          left: -160,
          pointerEvents: "none",
        }}
      />

      {/* Logo row */}
      <div
        style={{
          position: "relative",
          padding: "26px 36px",
        }}
      >
        <a href="/" style={{ textDecoration: "none", display: "inline-flex" }}>
          <Logo size={20} />
        </a>
      </div>

      {/* Centered content column */}
      <div
        style={{
          position: "relative",
          maxWidth: 760,
          margin: "0 auto",
          padding: "6px 24px 72px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ── CARD ──────────────────────────────────────────────────────────────────────
// Reference treatment: borderless near-white surface, big radius, wide soft
// shadow that barely lifts it off the ivory canvas.

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.lineSoft}`,
        borderRadius: 24,
        padding: "44px clamp(24px, 5vw, 56px) 40px",
        boxShadow: "0 30px 70px rgba(30, 35, 20, 0.07), 0 4px 16px rgba(30, 35, 20, 0.03)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── FORM TITLE ────────────────────────────────────────────────────────────────
// Centered serif heading with the short accent underline from the reference.

export function FormTitle({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        marginBottom: 30,
      }}
    >
      <h2
        style={{
          fontFamily: SERIF,
          fontSize: "clamp(26px, 3.4vw, 34px)",
          fontWeight: 500,
          letterSpacing: "-0.6px",
          margin: 0,
          marginBottom: 14,
          color: C.ink,
        }}
      >
        {children}
      </h2>
      <div
        style={{
          width: 74,
          height: 2,
          background: C.green,
          margin: "0 auto",
          opacity: 0.7,
        }}
      />
      {subtitle && (
        <p
          style={{
            fontSize: 14,
            color: C.muted,
            margin: "14px auto 0",
            maxWidth: 420,
            lineHeight: 1.55,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ── STEP PROGRESS INDICATOR ───────────────────────────────────────────────────
// Circle-check stepper from the reference: completed steps are soft sage
// discs with a green check, the current step is a white disc with a dark ring
// and ink numeral, upcoming steps are faint outlined discs. Thin connectors,
// labels underneath. Sits at the top of the page, above the card.

export function StepProgress({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div
      className="auth-stepper"
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        marginBottom: 34,
        padding: "6px 8px 0",
      }}
    >
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const isLast = i === steps.length - 1;
        return (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "flex-start",
              flex: isLast ? "0 0 auto" : 1,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 9,
                minWidth: 86,
              }}
            >
              {/* Circle */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14.5,
                  fontWeight: 500,
                  color: done ? C.green : active ? C.ink : C.faint,
                  background: done ? C.greenWash : C.white,
                  border: active ? `1.5px solid ${C.ink}` : `1px solid ${done ? C.greenWash : C.line}`,
                  boxShadow: active
                    ? "0 0 0 5px rgba(22, 21, 15, 0.05)"
                    : done
                      ? "none"
                      : "inset 0 0 0 4px rgba(255,255,255,0.6)",
                  transition: "all 0.3s ease",
                }}
              >
                {done ? <Check size={16} weight="bold" color={C.green} /> : i + 1}
              </div>
              {/* Label */}
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: active ? 700 : 500,
                  letterSpacing: "1.1px",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  color: done ? C.green : active ? C.ink : C.faint,
                  transition: "color 0.3s ease",
                }}
              >
                {label}
              </span>
            </div>
            {/* Connector */}
            {!isLast && (
              <div
                style={{
                  flex: 1,
                  height: 1,
                  borderRadius: 2,
                  marginTop: 20,
                  margin: "20px 14px 0",
                  background: done ? C.green : C.line,
                  transition: "background 0.3s ease",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── TEXT FIELD ────────────────────────────────────────────────────────────────
// Reference treatment: small quiet label above a soft-bordered white box.

export function TextField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  hint,
  autoComplete,
  clearable,
}: {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  autoComplete?: string;
  clearable?: boolean;
}) {
  const [focused, setFocused] = React.useState(false);
  const [show, setShow] = React.useState(false);
  const isPassword = type === "password";

  const borderColor = error ? C.red : focused ? C.green : C.line;

  return (
    <label style={{ display: "block" }}>
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 500,
          color: error ? C.red : C.muted,
          marginBottom: 7,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          border: `1px solid ${borderColor}`,
          background: C.white,
          borderRadius: 14,
          padding: "0 14px",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          boxShadow: focused ? "0 0 0 3px rgba(90, 122, 63, 0.12)" : "none",
        }}
      >
        <input
          name={name}
          type={isPassword && show ? "text" : type}
          value={value}
          autoComplete={autoComplete}
          placeholder={placeholder}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 14.5,
            fontWeight: 500,
            color: C.ink,
            padding: "13px 0",
            fontFamily: "inherit",
          }}
        />
        {clearable && !isPassword && value && (
          <button
            type="button"
            aria-label="Clear field"
            onClick={(e) => {
              e.preventDefault();
              onChange?.("");
            }}
            style={{
              background: "rgba(0,0,0,0.07)",
              border: "none",
              borderRadius: "50%",
              width: 20,
              height: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: C.muted,
              flexShrink: 0,
              padding: 0,
            }}
          >
            <X size={10} weight="bold" />
          </button>
        )}
        {isPassword && (
          <button
            type="button"
            aria-label={show ? "Hide password" : "Show password"}
            onClick={(e) => {
              e.preventDefault();
              setShow((v) => !v);
            }}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: C.faint,
              display: "flex",
              padding: 4,
            }}
          >
            {show ? <EyeSlash size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      {(error || hint) && (
        <div
          style={{
            fontSize: 12.5,
            marginTop: 6,
            marginLeft: 2,
            color: error ? C.red : C.faint,
          }}
        >
          {error || hint}
        </div>
      )}
    </label>
  );
}

// ── SELECT FIELD ──────────────────────────────────────────────────────────────
// Native select styled like the text fields ("---Please Select---" affordance).

export function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = "---Please Select---",
  error,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  error?: string;
}) {
  return (
    <label style={{ display: "block" }}>
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 500,
          color: error ? C.red : C.muted,
          marginBottom: 7,
        }}
      >
        {label}
      </div>
      <div
        style={{
          position: "relative",
          border: `1px solid ${error ? C.red : C.line}`,
          borderRadius: 14,
          background: C.white,
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        }}
      >
        <select
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            appearance: "none",
            border: "none",
            outline: "none",
            background: "transparent",
            fontSize: 14.5,
            fontWeight: 500,
            color: value ? C.ink : C.faint,
            padding: "13px 38px 13px 14px",
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <svg
          style={{
            position: "absolute",
            right: 14,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: C.muted,
          }}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      {error && (
        <div style={{ fontSize: 12.5, marginTop: 6, marginLeft: 2, color: C.red }}>{error}</div>
      )}
    </label>
  );
}



// ── BUTTONS ───────────────────────────────────────────────────────────────────
// Reference treatment: fully rounded pill buttons; black is the primary,
// white-with-soft-border is the secondary.

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
  loading,
  full,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
  full?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: full ? "100%" : undefined,
        background: C.ink,
        color: "#FCFCFA",
        border: "none",
        borderRadius: 999,
        padding: "13px 26px",
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: "0.2px",
        fontFamily: "inherit",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.55 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
        transition: "transform 0.2s ease, opacity 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  type = "button",
  full,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  full?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        width: full ? "100%" : undefined,
        background: C.white,
        border: `1px solid ${C.line}`,
        borderRadius: 999,
        padding: "13px 26px",
        color: C.ink,
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: "0.2px",
        fontFamily: "inherit",
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: "background 0.2s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.035)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = C.white)}
    >
      {children}
    </button>
  );
}

// Previous / Next pair from the reference: white "previous", black "next",
// right-aligned at the bottom of the card.

export function StepNav({
  onBack,
  onNext,
  backLabel = "Previous",
  nextLabel = "Next",
  loading,
  showBack = true,
}: {
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  loading?: boolean;
  showBack?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 12,
        marginTop: 30,
      }}
      className="auth-stepnav"
    >
      {showBack && (
        <GhostButton onClick={onBack}>
          <CaretLeft size={14} weight="bold" />
          {backLabel}
        </GhostButton>
      )}
      <PrimaryButton type={onNext ? "button" : "submit"} onClick={onNext} loading={loading}>
        {nextLabel}
        {!loading && <CaretRight size={14} weight="bold" />}
      </PrimaryButton>
    </div>
  );
}

export function Spinner({ size = 16, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <CircleNotch
      size={size}
      color={color}
      style={{ animation: "authspin 0.8s linear infinite", flexShrink: 0 }}
    />
  );
}

// ── PAGE LOADER ───────────────────────────────────────────────────────────────
// Full-screen overlay for operations that are taking long (network trouble):
// pulsing mark, spinner, and rotating status text so the wait feels
// intentional — "recording your progress…", "reaching the servers…".

export function PageLoader({ messages }: { messages: string[] }) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const t = window.setInterval(() => setI((v) => (v + 1) % messages.length), 2200);
    return () => window.clearInterval(t);
  }, [messages.length]);
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(244, 243, 238, 0.9)",
        backdropFilter: "blur(6px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}
    >
      <div style={{ animation: "nexuspulse 1.5s ease-in-out infinite" }}>
        <NexusMark size={46} />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: C.ink,
          fontSize: 15,
          fontWeight: 600,
        }}
      >
        <Spinner size={17} color={C.green} />
        <span key={i} style={{ animation: "nexusfade 0.45s ease" }}>
          {messages[Math.min(i, messages.length - 1)]}
        </span>
      </div>
      <style>
        {"@keyframes nexuspulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(0.92);opacity:0.7}}@keyframes nexusfade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}"}
      </style>
    </div>
  );
}

// ── ANIMATED CHECK ───────────────────────────────────────────────────────────
// Success moment: the ring draws itself, then the tick draws in while the
// whole badge pops. Pure CSS/SVG — plays every time it mounts.

export function AnimatedCheck({ size = 80 }: { size?: number }) {
  const R = 30;
  const CIRC = 2 * Math.PI * R;
  const CHECK_LEN = 42;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: C.greenWash,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "nexuspop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both",
      }}
    >
      <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 76 76" fill="none" aria-hidden>
        <circle
          cx="38"
          cy="38"
          r={R}
          stroke={C.green}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC}
          style={{ animation: "nexusdraw 0.7s ease-out 0.15s forwards" }}
        />
        <path
          d="M24 39.5 34 49 52 29"
          stroke={C.green}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={CHECK_LEN}
          strokeDashoffset={CHECK_LEN}
          style={{ animation: "nexusdraw 0.45s ease-out 0.8s forwards" }}
        />
      </svg>
      <style>
        {"@keyframes nexusdraw{to{stroke-dashoffset:0}}@keyframes nexuspop{0%{transform:scale(0.5);opacity:0}60%{transform:scale(1.06);opacity:1}100%{transform:scale(1);opacity:1}}"}
      </style>
    </div>
  );
}

// ── STATUS PILL ───────────────────────────────────────────────────────────────
// Pastel chip with a small glyph, like the status badges in the reference UI.

export function StatusPill({
  tone = "green",
  children,
  icon,
}: {
  tone?: "green" | "amber" | "red" | "violet";
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const tones: Record<string, { bg: string; fg: string }> = {
    green: { bg: C.greenDarkWash, fg: C.greenDark },
    amber: { bg: C.amberWash, fg: C.amber },
    red: { bg: C.redWash, fg: C.red },
    violet: { bg: C.violetWash, fg: C.violet },
  };
  const t = tones[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: t.bg,
        color: t.fg,
        borderRadius: 999,
        padding: "5px 13px",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {icon}
      {children}
    </span>
  );
}

// ── TIP BANNER ────────────────────────────────────────────────────────────────
// Soft amber helper box, like the signup tip in the reference.

export function TipBanner({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: C.amberWash,
        borderRadius: 12,
        padding: "12px 16px",
        fontSize: 13.5,
        color: C.amber,
        fontWeight: 500,
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}

// ── CHECKBOX ──────────────────────────────────────────────────────────────────

export function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        cursor: "pointer",
        fontSize: 13.5,
        color: C.muted,
        lineHeight: 1.45,
        userSelect: "none",
      }}
    >
      <span
        onClick={(e) => {
          e.preventDefault();
          onChange(!checked);
        }}
        style={{
          flexShrink: 0,
          width: 19,
          height: 19,
          borderRadius: 7,
          border: `1px solid ${checked ? C.green : C.line}`,
          background: checked ? C.greenWash : C.white,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s ease",
          marginTop: 1,
        }}
      >
        {checked && <Check size={12} weight="bold" color={C.green} />}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
      />
      <span>{children}</span>
    </label>
  );
}

// ── SOCIAL ROW ────────────────────────────────────────────────────────────────

export function SocialButtons({
  busy = null,
  onSelect,
}: {
  busy?: string | null;
  onSelect?: (provider: "google" | "microsoft") => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <SocialButton
        loading={busy === "google"}
        disabled={busy != null && busy !== "google"}
        onClick={() => onSelect?.("google")}
      >
        <GoogleGlyph />
        Google
      </SocialButton>
      <SocialButton
        loading={busy === "microsoft"}
        disabled={busy != null && busy !== "microsoft"}
        onClick={() => onSelect?.("microsoft")}
      >
        <MicrosoftGlyph />
        Microsoft
      </SocialButton>
    </div>
  );
}

export function SocialButton({
  children,
  onClick,
  loading,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
        background: C.white,
        border: `1px solid ${C.line}`,
        borderRadius: 999,
        padding: "12px 18px",
        color: C.ink,
        fontSize: 13.5,
        fontWeight: 600,
        fontFamily: "inherit",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled || loading ? 0.6 : 1,
        transition: "background 0.2s ease, opacity 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) e.currentTarget.style.background = "rgba(0,0,0,0.035)";
      }}
      onMouseLeave={(e) => (e.currentTarget.style.background = C.white)}
    >
      {loading ? <Spinner size={16} color={C.green} /> : children}
    </button>
  );
}

export function Divider() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        color: C.faint,
        fontSize: 12.5,
        margin: "20px 0",
      }}
    >
      <span style={{ flex: 1, height: 1, background: C.lineSoft }} />
      or continue with
      <span style={{ flex: 1, height: 1, background: C.lineSoft }} />
    </div>
  );
}

export function GoogleGlyph() {
  return <GoogleLogo size={16} />;
}

export function MicrosoftGlyph() {
  return <WindowsLogo size={15} />;
}

export function AppleGlyph() {
  return <AppleLogo size={16} />;
}

// ── SHARED FORM GRID ──────────────────────────────────────────────────────────
// Two-column field grid on desktop, single column on mobile (reference layout).

export function FieldGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="auth-fieldgrid"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "18px 22px",
      }}
    >
      {children}
    </div>
  );
}

export const AUTH_CSS = `
  @media (max-width: 640px) {
    .auth-fieldgrid { grid-template-columns: 1fr !important; }
    .auth-stepper { flex-wrap: wrap; row-gap: 14px; }
  }
`;
