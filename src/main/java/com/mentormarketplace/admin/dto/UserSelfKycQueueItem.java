package com.mentormarketplace.admin.dto;

import java.util.UUID;

public record UserSelfKycQueueItem(
        UUID userId,
        String phoneCountryCode,
        String phoneNational,
        Integer age,
        String firstName,
        String lastName,
        String aadharMasked,
        String kycStatus
) {
}
