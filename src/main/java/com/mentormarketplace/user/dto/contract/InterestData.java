package com.mentormarketplace.user.dto.contract;

import java.util.UUID;

public record InterestData(
        UUID id,
        String categoryId,
        String subcategoryId,
        String language
) {
}
