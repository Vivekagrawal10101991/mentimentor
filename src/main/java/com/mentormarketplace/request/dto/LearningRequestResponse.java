package com.mentormarketplace.request.dto;

import java.time.Instant;
import java.util.UUID;

public record LearningRequestResponse(
        UUID id,
        UUID menteeId,
        String category,
        String subcategory,
        String mode,
        String scheduleType,
        String preferredSchedule,
        String locationPreference,
        String offlineVenueType,
        String status,
        String matchingNote,
        Instant confirmationExpiresAt,
        Long confirmationRemainingSeconds
) {
}
