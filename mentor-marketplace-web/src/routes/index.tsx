import { createBrowserRouter, Navigate, useParams } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { BookingPage } from "@/pages/BookingPage";
import { HomePage } from "@/pages/HomePage";
import { AdminLoginPage, LoginPage, SignupPage } from "@/pages/AuthPage";
import { AccountDetailsPage } from "@/pages/AccountDetailsPage";
import { AccountVerificationPage } from "@/pages/AccountVerificationPage";
import { AdminKycPage } from "@/pages/AdminKycPage";
import { RouteErrorPage } from "@/pages/RouteErrorPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { ParentVerificationPage } from "@/pages/ParentVerificationPage";
import { MenteeProfilePage } from "@/pages/MenteeProfilePage";
import { MentorOnboardingPage } from "@/pages/MentorOnboardingPage";
import { PaymentPage } from "@/pages/PaymentPage";
import { PostLoginHubPage } from "@/pages/PostLoginHubPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { RequestPage } from "@/pages/RequestPage";
import { SessionStartPage } from "@/pages/SessionStartPage";
import { MapSearchPage } from "@/pages/MapSearchPage";
import { SearchPage } from "@/pages/SearchPage";
import { SessionConfirmationPage } from "@/pages/SessionConfirmationPage";
import { SessionRequestPage } from "@/pages/SessionRequestPage";
import { StudyPartnerPage } from "@/pages/StudyPartnerPage";
import { VideoSessionPage } from "@/pages/VideoSessionPage";

function SessionStartLegacyRedirect() {
  const { bookingId } = useParams<{ bookingId: string }>();
  if (!bookingId) {
    return <Navigate to="/" replace />;
  }
  return <Navigate to={`/bookings/${bookingId}/start-session`} replace />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
      { path: "account/verification", element: <AccountVerificationPage /> },
      { path: "account/details", element: <AccountDetailsPage /> },
      { path: "admin/login", element: <AdminLoginPage /> },
      { path: "admin/kyc", element: <AdminKycPage /> },
      { path: "onboarding", element: <OnboardingPage /> },
      { path: "parent-verification", element: <ParentVerificationPage /> },
      { path: "profiles", element: <PostLoginHubPage /> },
      { path: "profiles/mentee", element: <MenteeProfilePage /> },
      { path: "profiles/mentor", element: <MentorOnboardingPage /> },
      { path: "mentor-onboarding", element: <MentorOnboardingPage /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "study-partner", element: <StudyPartnerPage /> },
      { path: "video-session", element: <VideoSessionPage /> },
      { path: "requests/create", element: <RequestPage /> },
      { path: "search", element: <SearchPage /> },
      { path: "search/offline", element: <MapSearchPage /> },
      { path: "mentors/:mentorId/book", element: <BookingPage /> },
      {
        path: "mentors/:mentorId/session-request",
        element: <SessionRequestPage />,
      },
      { path: "bookings/:bookingId/payment", element: <PaymentPage /> },
      {
        path: "bookings/:bookingId/confirm",
        element: <SessionConfirmationPage />,
      },
      {
        path: "bookings/:bookingId/start-session",
        element: <SessionStartPage />,
      },
      {
        path: "bookings/:bookingId/video-session",
        element: <VideoSessionPage />,
      },
      {
        path: "bookings/:bookingId/mentors/:mentorId/start",
        element: <SessionStartLegacyRedirect />,
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
