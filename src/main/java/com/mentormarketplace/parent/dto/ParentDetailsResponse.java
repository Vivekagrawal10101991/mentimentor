package com.mentormarketplace.parent.dto;

import java.util.UUID;

public record ParentDetailsResponse(
        UUID id,
        UUID userId,
        String parentName,
        String parentPhone,
        String parentAadharNumber,
        String kycStatus
) {
}
