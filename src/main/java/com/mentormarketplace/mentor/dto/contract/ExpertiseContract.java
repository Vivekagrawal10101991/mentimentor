package com.mentormarketplace.mentor.dto.contract;

import java.util.UUID;

public record ExpertiseContract(
        UUID categoryId,
        UUID subcategoryId,
        String language,
        String categoryName,
        String subcategoryName
) {
}
