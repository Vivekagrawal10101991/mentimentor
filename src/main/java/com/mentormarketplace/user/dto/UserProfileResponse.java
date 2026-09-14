package com.mentormarketplace.user.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record UserProfileResponse(
        UUID profileId,
        UUID userId,
        List<String> interests,
        String language,
        Instant createdAt,
        Instant updatedAt
) {
}
