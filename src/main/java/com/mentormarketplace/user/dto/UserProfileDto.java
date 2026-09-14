package com.mentormarketplace.user.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record UserProfileDto(
        UUID id,
        String phoneNumber,
        String countryCode,
        List<String> roles,
        Instant createdAt,
        Instant updatedAt
) {
}

