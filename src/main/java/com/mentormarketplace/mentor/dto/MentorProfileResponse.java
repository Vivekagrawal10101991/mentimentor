package com.mentormarketplace.mentor.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record MentorProfileResponse(
        UUID id,
        UUID userId,
        List<ExpertiseRequest> expertise,
        BigDecimal hourlyRate,
        List<String> languages,
        String experienceDetails,
        String linkedinProfile,
        String testStatus,
        BigDecimal rating,
        Instant createdAt,
        Instant updatedAt
) {
}
