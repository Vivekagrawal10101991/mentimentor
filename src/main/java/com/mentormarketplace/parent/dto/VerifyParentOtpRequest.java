package com.mentormarketplace.parent.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.util.UUID;

public record VerifyParentOtpRequest(
        @NotNull UUID otpRequestId,
        @NotBlank @Pattern(regexp = "^[0-9]{4,6}$", message = "otpCode must be 4-6 digits") String otpCode
) {
}
