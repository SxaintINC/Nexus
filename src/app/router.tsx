// ── APP ROUTER ────────────────────────────────────────────────────────────────
// The only place that maps URLs to features. Each route component comes from
// its feature's page.tsx barrel — features never import each other's internals,
// and this file contains no UI logic of its own.

import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";

import { Dashboard } from "../features/dashboard/page";
// Landing and Getstarted export their page as the module default; the auth
// and dashboard features use named barrels.
import Landing from "../features/landing/page";
import Getstarted from "../features/getstarted/page";
import { Login, Signup, ForgotPassword, Onboarding } from "../features/auth/page";

// Every route change mounts a fresh wrapper with a soft fade — pages keep
// their own staggered entrances on top of this base transition.
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="route-fade">
      <Routes location={location}>
        <Route path="/" element={<Landing />} />
        <Route path="/home" element={<Dashboard />} />
        <Route path="/getstarted" element={<Getstarted />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
