package com.mentormarketplace.booking.dto.contract;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record StartSessionOtpRequest(
        @NotBlank String otpCode,
        @NotNull String actorRole
) {
}
