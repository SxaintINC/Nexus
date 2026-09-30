// ── AUTH FEATURE BARREL ───────────────────────────────────────────────────────
// The feature's public surface. src/app router imports auth pages ONLY through
// this file; the page internals live in page/ and are not app-facing.

export { default as Login } from "./page/login";
export { default as Signup } from "./page/signup";
export { default as ForgotPassword } from "./page/forgot-password";
export { default as Onboarding } from "./page/onboarding";
