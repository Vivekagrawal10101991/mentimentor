package com.mentormarketplace.mentor.dto;

import jakarta.validation.constraints.NotBlank;

public record ExpertiseRequest(
        @NotBlank String category,
        @NotBlank String subcategory
) {
}
