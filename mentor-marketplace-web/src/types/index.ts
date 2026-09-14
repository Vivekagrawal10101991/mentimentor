/** Shared domain types aligned with mentor-marketplace-openapi.yaml */

export type OtpPurpose = "login";

/** How the API exposes the OTP after POST /auth/otp/send */
export type OtpDeliveryHint = "sms" | "dev_log" | "none";

export interface SendOtpRequest {
  phoneNumber: string;
  countryCode: string;
  purpose: OtpPurpose;
  deviceId?: string;
}

export interface SendOtpResponse {
  otpRequestId: string;
  expiresAt: string;
  resendAfterSeconds: number;
  deliveryHint: OtpDeliveryHint;
}

export interface VerifyOtpRequest {
  otpRequestId: string;
  otpCode: string;
  deviceId?: string;
}

export type UserRole = "mentee" | "mentor" | "admin" | "super_admin";

export type AdminPortalKind = "SUPER_ADMIN" | "ADMIN";

export interface PortalAdminListItem {
  id: string;
  username: string;
  kind: AdminPortalKind;
  active: boolean;
  createdAt: string;
}

export interface UserSummary {
  id: string;
  phoneNumber: string;
  roles: UserRole[];
}

export interface VerifyOtpResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: UserSummary;
}

export interface Location {
  city: string;
  state?: string;
  country: string;
  lat?: number;
  lng?: number;
  formattedAddress?: string;
  pinCode?: string;
}

export type KycLifecycleStatus =
  | "PENDING"
  | "SUBMITTED"
  | "VERIFIED"
  | "REJECTED";

export interface UserProfile {
  id: string;
  /** Omitted or null when not set in the database (UI may show a friendly placeholder). */
  firstName?: string | null;
  lastName?: string | null;
  age?: number;
  isMinor?: boolean;
  phoneNumber: string;
  countryCode: string;
  avatarUrl?: string;
  timezone: string;
  languages: string[];
  location: Location;
  roles: UserRole[];
  createdAt: string;
  updatedAt: string;
  selfKycStatus?: KycLifecycleStatus | null;
  parentKycStatus?: KycLifecycleStatus | null;
  parentDetailsId?: string | null;
  accountVerificationComplete?: boolean;
}

export interface UserProfileEnvelope {
  data: UserProfile;
}

export type PreferredLearningMode = "online" | "offline" | "both";

export interface UpdateUserProfileRequest {
  firstName?: string;
  lastName?: string;
  age?: number;
  /** 12-digit Aadhaar for users 18+; sent for admin review. */
  aadharReference?: string;
  preferredLearningMode?: PreferredLearningMode;
  preferredSchedule?: string;
}

export interface AddParentDetailsRequest {
  parentName: string;
  parentPhone: string;
  parentAadharNumber: string;
}

export interface ParentDetailsResponse {
  id: string;
  userId: string;
  parentName: string;
  parentPhone: string;
  parentAadharNumber?: string;
  kycStatus: KycLifecycleStatus;
}

export interface ParentSendOtpRequest {
  parentDetailsId: string;
}

export interface ParentOtpResponse {
  otpRequestId: string;
  expiresAt: string;
}

export interface ParentVerifyOtpRequest {
  otpRequestId: string;
  otpCode: string;
}

export interface ParentOtpVerifyResponse {
  parentDetailsId: string;
  kycStatus: KycLifecycleStatus;
}

/** Admin KYC queue (GET /admin/kyc/pending) */
export interface ParentKycQueueItem {
  id: string;
  userId: string;
  userPhoneCountryCode: string;
  userPhoneNational: string;
  userAge: number | null;
  parentName: string;
  parentPhone: string;
  parentAadharMasked: string;
  kycStatus: string;
}

export interface UserSelfKycQueueItem {
  userId: string;
  phoneCountryCode: string;
  phoneNational: string;
  age: number | null;
  firstName: string;
  lastName: string;
  aadharMasked: string;
  kycStatus: string;
}

export interface PendingKycResponse {
  parentGuardianSubmissions: ParentKycQueueItem[];
  adultSelfSubmissions: UserSelfKycQueueItem[];
}

export interface CreateLearningRequestPayload {
  category: string;
  subcategory: string;
  mode: "online" | "offline";
  scheduleType: "now" | "later";
  preferredSchedule?: string;
  locationPreference?: string;
  offlineVenueType?: "AT_MENTOR" | "INVITE_MENTOR";
}

export interface LearningRequestResponse {
  id: string;
  menteeId: string;
  category: string;
  subcategory: string;
  mode: "online" | "offline";
  scheduleType: "now" | "later";
  preferredSchedule?: string | null;
  locationPreference?: string | null;
  offlineVenueType?: string | null;
  status: string;
  matchingNote: string;
  confirmationExpiresAt?: string | null;
  confirmationRemainingSeconds?: number | null;
}

export interface DashboardLearningRequestSummary {
  id: string;
  category: string;
  subcategory: string;
  mode: string;
  scheduleType: string;
  status: string;
  createdAt: string;
}

export interface UserDashboardResponse {
  mentor: {
    mentorId: string;
    hourlyRate: number;
    experienceDetails?: string;
    linkedinProfile?: string;
    testStatus: string;
    skillSummaries: string[];
    requestsReceivedCount: number;
    mentimentorRating?: number | null;
    knowledgeRating?: number | null;
    pedagogyRating?: number | null;
    verificationStatus?: string;
    profileCompletenessPercent?: number;
    onboardingStatus?: string;
  } | null;
  mentee: {
    userId: string;
    age?: number;
    isMinor: boolean;
    preferredLearningMode?: PreferredLearningMode;
    preferredSchedule?: string;
    learningRequests: DashboardLearningRequestSummary[];
  } | null;
  recommendedPrice: number;
  learningHistory: string[];
}

export interface InterestInput {
  categoryId: string;
  subcategoryId: string;
  language: string;
}

export interface Interest extends InterestInput {
  id: string;
}

export interface UpsertInterestsRequest {
  interests: InterestInput[];
}

export interface InterestsEnvelope {
  data: Interest[];
}

export interface Expertise {
  categoryId: string;
  subcategoryId: string;
  language: string;
  categoryName?: string;
  subcategoryName?: string;
}

export type SessionMode = "video" | "voice" | "chat";

export interface PricingPackage {
  packageId: string;
  durationMinutes: number;
  priceAmount: number;
  currency: "INR";
  isActive: boolean;
}

export interface Availability {
  slotId: string;
  startTime: string;
  endTime: string;
  timezone: string;
  recurrenceRule?: string;
}

export interface MentorSearchItem {
  mentorId: string;
  fullName: string;
  headline: string;
  rating: number;
  totalSessions: number;
  expertise: Expertise[];
  pricingPackages: PricingPackage[];
  isAvailableNow: boolean;
  nextAvailableAt?: string;
  location: Location;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface MentorSearchResponse {
  data: MentorSearchItem[];
  pagination: Pagination;
}

export type MentorDetailData = MentorSearchItem & {
  bio: string;
  modalities: SessionMode[];
  availability: Availability[];
  college?: string | null;
  highestQualification?: string | null;
  teachingExperienceYears?: number | null;
  verificationStatus?: string | null;
  recommendedHourlyRate?: number | null;
  knowledgeRating?: number | null;
  pedagogyRating?: number | null;
  whyThisMentor?: string | null;
  teachingMode?: string | null;
};

export interface MentorDetailResponse {
  data: MentorDetailData;
}

export type BookingType = "instant" | "scheduled";

export type BookingStatus =
  | "created"
  | "payment_pending"
  | "confirmed"
  | "started"
  | "completed"
  | "cancelled"
  | "failed"
  | "mentor_no_show"
  | "mentee_no_show";

export interface PricingBreakdown {
  grossAmount: number;
  discountAmount: number;
  payableAmount: number;
  currency: "INR";
}

export interface Booking {
  bookingId: string;
  menteeId: string;
  mentorId: string;
  packageId: string;
  bookingType: BookingType;
  sessionMode: SessionMode;
  status: BookingStatus;
  startTime: string | null;
  endTime: string | null;
  pricing: PricingBreakdown;
  sessionStartOtpIssuedAt?: string | null;
  sessionStartOtpExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingEnvelope {
  data: Booking;
}

export interface CreateBookingRequest {
  mentorId: string;
  packageId: string;
  bookingType: BookingType;
  sessionMode: SessionMode;
  scheduledStartTime?: string;
  notes?: string;
}

export type SessionActorRole = "mentor" | "mentee";

export interface StartSessionOtpRequest {
  otpCode: string;
  actorRole: SessionActorRole;
}

export interface SessionStartData {
  bookingId: string;
  status: "confirmed" | "started";
  otpValidatedBy: SessionActorRole[];
  sessionStarted: boolean;
  startedAt?: string;
}

export interface SessionStartEnvelope {
  data: SessionStartData;
}
