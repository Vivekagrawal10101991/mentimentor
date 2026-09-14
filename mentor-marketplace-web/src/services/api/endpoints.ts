/** Central place for API path segments (OpenAPI v1). */
export const endpoints = {
  sendOtp: "/auth/otp/send",
  verifyOtp: "/auth/otp/verify",
  adminPortalLogin: "/auth/admin/login",
  googleAuth: "/auth/google",
  usersMe: "/users/me",
  usersMeInterests: "/users/me/interests",
  userDashboard: "/user/dashboard",
  parentAddDetails: "/parent/add-details",
  parentSendOtp: "/parent/send-otp",
  parentVerifyOtp: "/parent/verify-otp",
  requestCreate: "/requests/create",
  requestsMe: "/requests/me",
  requestsMentorIncoming: "/requests/mentor/incoming",
  requestMentorAccept: (requestId: string) => `/requests/${requestId}/mentor/accept`,
  requestMentorReject: (requestId: string) => `/requests/${requestId}/mentor/reject`,
  mentorsMeProfile: "/mentors/me/profile",
  mentorsMeOnboarding: "/mentors/me/onboarding",
  mentorsSearch: "/mentors/search",
  mentorById: (mentorId: string) => `/mentors/${mentorId}`,
  bookings: "/bookings",
  bookingById: (bookingId: string) => `/bookings/${bookingId}`,
  bookingSessionStartOtp: (bookingId: string) =>
    `/bookings/${bookingId}/session-start-otp`,
  bookingEnd: (bookingId: string) => `/bookings/${bookingId}/end`,
  payments: "/payments",
  paymentById: (paymentId: string) => `/payments/${paymentId}`,
  requestMentorConfirm: (requestId: string) =>
    `/requests/${requestId}/mentor/confirm`,
  adminPortalAdmins: "/admin/admins",
  adminKycPending: "/admin/kyc/pending",
  adminKycApproveParent: (parentDetailsId: string) =>
    `/admin/kyc/parent/${parentDetailsId}/approve`,
  adminKycRejectParent: (parentDetailsId: string) =>
    `/admin/kyc/parent/${parentDetailsId}/reject`,
  adminKycApproveUserSelf: (userId: string) =>
    `/admin/kyc/user-self/${userId}/approve`,
  adminKycRejectUserSelf: (userId: string) =>
    `/admin/kyc/user-self/${userId}/reject`,
} as const;
