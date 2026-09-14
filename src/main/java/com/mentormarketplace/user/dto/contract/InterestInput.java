package com.mentormarketplace.user.dto.contract;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Category and subcategory are stable string slugs (same as mentor expertise and the web onboarding UI),
 * not database UUIDs.
 */
public record InterestInput(
        @NotBlank @Size(max = 128) String categoryId,
        @NotBlank @Size(max = 128) String subcategoryId,
        @NotBlank @Size(min = 2, max = 32) String language
) {
}
