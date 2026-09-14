package com.mentormarketplace.mentor.dto.contract;

import com.mentormarketplace.user.dto.contract.LocationData;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record MentorProfileData(
        UUID mentorId,
        String bio,
        List<ExpertiseContract> expertise,
        List<String> modalities,
        List<PricingPackageContract> pricingPackages,
        List<AvailabilityContract> availability,
        LocationData location,
        BigDecimal rating,
        int totalSessions,
        boolean isAvailableNow
) {
}
