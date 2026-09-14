package com.mentormarketplace.admin.dto;

import java.util.UUID;

public record ParentKycQueueItem(
        UUID id,
        UUID userId,
        String userPhoneCountryCode,
        String userPhoneNational,
        Integer userAge,
        String parentName,
        String parentPhone,
        String parentAadharMasked,
        String kycStatus
) {
}
