package com.mentormarketplace.mentor.availability.dto;

import java.time.Instant;
import java.util.UUID;

public record MentorAvailabilityResponse(
        UUID mentorId,
        boolean available,
        Double lat,
        Double lng,
        Instant updatedAt
) {
}
