package com.mentormarketplace.user.dto.contract;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record UserProfileData(
        UUID id,
        String firstName,
        String lastName,
        Integer age,
        boolean isMinor,
        String phoneNumber,
        String countryCode,
        String avatarUrl,
        String timezone,
        List<String> languages,
        LocationData location,
        List<String> roles,
        Instant createdAt,
        Instant updatedAt,
        /** Adult self KYC lifecycle; null if not started. */
        String selfKycStatus,
        /** Latest parent/guardian submission status for minors; null if none. */
        String parentKycStatus,
        UUID parentDetailsId,
        /** True when age is set and the correct KYC path is admin-approved. */
        boolean accountVerificationComplete
) {
}
