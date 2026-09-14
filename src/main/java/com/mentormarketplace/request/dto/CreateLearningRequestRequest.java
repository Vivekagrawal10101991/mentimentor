package com.mentormarketplace.request.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateLearningRequestRequest(
        @NotBlank String category,
        @NotBlank String subcategory,
        @NotBlank @Pattern(regexp = "^(online|offline)$") String mode,
        @NotBlank @Pattern(regexp = "^(now|later)$") String scheduleType,
        @Size(max = 512) String preferredSchedule,
        @Size(max = 512) String locationPreference,
        /** AT_MENTOR or INVITE_MENTOR when mode is offline. */
        String offlineVenueType
) {
    public CreateLearningRequestRequest {
        if (offlineVenueType != null && offlineVenueType.isBlank()) {
            offlineVenueType = null;
        }
    }
}
