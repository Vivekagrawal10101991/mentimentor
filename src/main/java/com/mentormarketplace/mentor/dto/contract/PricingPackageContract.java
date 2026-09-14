package com.mentormarketplace.mentor.dto.contract;

import java.util.UUID;

public record PricingPackageContract(
        UUID packageId,
        int durationMinutes,
        int priceAmount,
        String currency,
        boolean isActive
) {
}
