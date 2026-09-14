package com.mentormarketplace.mentor.availability.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record MentorAvailabilityRequest(
        @NotNull UUID mentorId,
        @NotNull Boolean available,
        Double lat,
        Double lng
) {
}
