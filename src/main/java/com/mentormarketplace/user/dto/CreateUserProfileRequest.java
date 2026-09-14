package com.mentormarketplace.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record CreateUserProfileRequest(
        @NotNull UUID userId,
        @NotEmpty List<@NotBlank String> interests,
        @NotBlank @Size(max = 32) String language
) {
}
