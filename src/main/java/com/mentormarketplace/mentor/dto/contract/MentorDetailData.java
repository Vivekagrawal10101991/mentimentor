package com.mentormarketplace.mentor.dto.contract;

import com.mentormarketplace.user.dto.contract.LocationData;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record MentorDetailData(
        UUID mentorId,
        String fullName,
        String headline,
        BigDecimal rating,
        int totalSessions,
        List<ExpertiseContract> expertise,
        List<PricingPackageContract> pricingPackages,
        boolean isAvailableNow,
        Instant nextAvailableAt,
        LocationData location,
        String bio,
        List<String> modalities,
        List<AvailabilityContract> availability,
        String college,
        String highestQualification,
        Integer teachingExperienceYears,
        String verificationStatus,
        BigDecimal recommendedHourlyRate,
        BigDecimal knowledgeRating,
        BigDecimal pedagogyRating,
        String whyThisMentor,
        String teachingMode
) {
}
