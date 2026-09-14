package com.mentormarketplace.common.model;

/**
 * Identity verification lifecycle for parent/guardian records and adult self-serve KYC.
 */
public enum KycStatus {
    /** Parent record created; parent OTP not completed yet. */
    PENDING,
    /** Awaiting manual admin review (parent OTP done, or adult submitted Aadhaar reference). */
    SUBMITTED,
    VERIFIED,
    REJECTED
}
