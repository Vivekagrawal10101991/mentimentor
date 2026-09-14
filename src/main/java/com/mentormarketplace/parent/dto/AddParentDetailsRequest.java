package com.mentormarketplace.parent.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AddParentDetailsRequest(
        @NotBlank @Size(max = 128) String parentName,
        @NotBlank @Pattern(regexp = "^[0-9]{6,15}$", message = "parentPhone must be 6-15 digits") String parentPhone,
        @NotBlank @Pattern(regexp = "^[0-9]{12}$", message = "parent Aadhaar must be 12 digits") String parentAadharNumber
) {
}
