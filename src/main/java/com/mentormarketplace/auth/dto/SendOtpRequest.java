package com.mentormarketplace.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record SendOtpRequest(
        @NotBlank
        @Pattern(regexp = "^[0-9]{6,15}$", message = "phoneNumber must be 6-15 digits")
        String phoneNumber,

        @NotBlank
        @Pattern(regexp = "^\\+[1-9][0-9]{0,3}$", message = "countryCode must be in +<1-3 digits> format")
        String countryCode,

        @NotNull
        OtpPurpose purpose,

        @Size(max = 128)
        String deviceId
) {
}

