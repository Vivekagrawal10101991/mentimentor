package com.mentormarketplace.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record VerifyOtpRequest(
        @NotNull
        UUID otpRequestId,

        @NotBlank
        @Pattern(regexp = "^[0-9]{4,6}$", message = "otpCode must be 4-6 digits")
        String otpCode,

        @Size(max = 128)
        String deviceId
) {
}

