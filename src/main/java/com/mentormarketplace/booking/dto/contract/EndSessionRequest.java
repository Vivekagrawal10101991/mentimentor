package com.mentormarketplace.booking.dto.contract;

import jakarta.validation.constraints.NotBlank;

public record EndSessionRequest(
        @NotBlank String endedBy,
        String reason
) {
}
