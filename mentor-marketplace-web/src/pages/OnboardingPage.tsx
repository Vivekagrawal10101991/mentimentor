import { Navigate } from "react-router-dom";

/** @deprecated Use `/profiles/mentee` — kept for bookmarks. */
export function OnboardingPage() {
  return <Navigate to="/profiles/mentee" replace />;
}
