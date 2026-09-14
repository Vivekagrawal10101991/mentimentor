package com.mentormarketplace.mentor.dto.onboarding;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record MentorOnboardingStatusResponse(
        UUID mentorId,
        int onboardingStep,
        String onboardingStatus,
        int profileCompletenessPercent,
        String verificationStatus,
        BigDecimal knowledgeScore,
        BigDecimal knowledgeRating,
        BigDecimal pedagogyScore,
        BigDecimal pedagogyRating,
        BigDecimal recommendedHourlyRate,
        BigDecimal mentimentorRating,
        String city,
        String teachingMode,
        String highestQualification,
        String college,
        String degree,
        Integer teachingExperienceYears,
        List<String> expertiseCategories,
        List<String> expertiseSubcategories,
        List<String> rateBreakdown
) {
}
