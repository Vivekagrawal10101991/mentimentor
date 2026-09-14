package com.mentormarketplace.user.dto.dashboard;

import java.time.Instant;
import java.util.UUID;

public record LearningRequestSummary(
        UUID id,
        String category,
        String subcategory,
        String mode,
        String scheduleType,
        String status,
        Instant createdAt
) {
}
