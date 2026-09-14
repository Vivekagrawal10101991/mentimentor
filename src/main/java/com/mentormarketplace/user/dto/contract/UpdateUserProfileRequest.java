package com.mentormarketplace.user.dto.contract;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UpdateUserProfileRequest(
        @Size(min = 1, max = 64) String firstName,
        @Size(min = 1, max = 64) String lastName,
        Integer age,
        /** 12-digit Aadhaar number for adults; submitted for admin review (minors use parent flow). */
        @Pattern(regexp = "^[0-9]{12}$", message = "Aadhaar must be exactly 12 digits") String aadharReference,
        String avatarUrl,
        String timezone,
        String preferredLearningMode,
        String preferredSchedule,
        @Size(min = 1) List<@Size(min = 2, max = 32) String> languages,
        LocationInput location
) {
}
