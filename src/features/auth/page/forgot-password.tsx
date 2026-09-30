import { useState } from "react";
import { Link } from "react-router-dom";
import { EnvelopeSimple } from "@phosphor-icons/react";

import {
  AuthShell,
  Card,
  FormTitle,
  TextField,
  PrimaryButton,
  StatusPill,
  C,
  APP_NAME,
} from "../../../shared/ui/kit";
import { authErrorMessage, supabase, supabaseReady } from "../../../shared/lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(undefined);
    setLoading(true);
    if (!supabaseReady) {
      // Demo fallback when Supabase isn't configured yet.
      window.setTimeout(() => {
        setLoading(false);
        setSent(true);
      }, 900);
      return;
    }
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login?reset=1`,
    });
    setLoading(false);
    if (err) {
      setError(authErrorMessage(err));
      return;
    }
    setSent(true);
  };

  return (
    <AuthShell>
      <div style={{ maxWidth: 560, margin: "0 auto", paddingTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <StatusPill tone="amber">Password recovery</StatusPill>
        </div>

        <Card>
          {!sent ? (
            <>
              <FormTitle                subtitle={`Enter the email tied to your ${APP_NAME} workspace and we'll send you a secure link to choose a new password.`}>
                Reset your password
              </FormTitle>

              <form onSubmit={submit} noValidate>
                <TextField
                  label="Email address"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(v) => setEmail(v)}
                  placeholder="you@school.edu.ng"
                  autoComplete="email"
                  error={error}
                />
                <div style={{ marginTop: 22 }}>
                  <PrimaryButton type="submit" full loading={loading}>
                    {loading ? "Sending link…" : "Send reset link"}
                  </PrimaryButton>
                </div>
              </form>

              <p
                style={{
                  textAlign: "center",
                  fontSize: 13.5,
                  color: C.faint,
                  marginTop: 22,
                  marginBottom: 0,
                }}
              >
                Remembered it after all?{" "}
                <Link to="/login" style={{ color: C.green, fontWeight: 600, textDecoration: "none" }}>
                  Back to sign in
                </Link>
              </p>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: C.greenWash,
                  color: "#4E6B38",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                }}
              >
                <EnvelopeSimple size={26} weight="regular" />
              </div>

              <FormTitle>Check your inbox</FormTitle>

              <p style={{ fontSize: 14.5, color: C.muted, margin: "-10px auto 20px", maxWidth: 360, lineHeight: 1.6 }}>
                We sent a reset link to <strong style={{ color: C.ink }}>{email}</strong>. It expires in 30
                minutes — check your spam folder if it hasn't arrived.
              </p>

              <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                <StatusPill tone="green">Link sent</StatusPill>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <Link
                  to="/login"
                  style={{
                    background: C.ink,
                    border: `1px solid ${C.ink}`,
                    borderRadius: 999,
                    padding: "14px 26px",
                    color: C.paper,
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: "0.4px",
                    textTransform: "uppercase",
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  Back to sign in
                </Link>
                <PrimaryButton
                  onClick={() => {
                    setSent(false);
                    setEmail("");
                  }}
                >
                  Use a different email
                </PrimaryButton>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AuthShell>
  );
}
