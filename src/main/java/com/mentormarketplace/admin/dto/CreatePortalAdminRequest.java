package com.mentormarketplace.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreatePortalAdminRequest(
        @NotBlank
        @Size(min = 3, max = 64)
        @Pattern(regexp = "^[a-z0-9_]+$", message = "username must be lowercase letters, digits, or underscore")
        String username,
        @NotBlank @Size(min = 8, max = 128) String password
) {
}
