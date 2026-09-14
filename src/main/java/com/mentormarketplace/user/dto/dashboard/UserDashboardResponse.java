package com.mentormarketplace.user.dto.dashboard;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record UserDashboardResponse(
        MentorDashboardData mentor,
        MenteeDashboardData mentee,
        BigDecimal recommendedPrice,
        List<String> learningHistory
) {
    public record MentorDashboardData(
            UUID mentorId,
            BigDecimal hourlyRate,
            String experienceDetails,
            String linkedinProfile,
            String testStatus,
            List<String> skillSummaries,
            int requestsReceivedCount,
            BigDecimal mentimentorRating,
            BigDecimal knowledgeRating,
            BigDecimal pedagogyRating,
            String verificationStatus,
            int profileCompletenessPercent,
            String onboardingStatus
    ) {
    }

    public record MenteeDashboardData(
            UUID userId,
            Integer age,
            boolean isMinor,
            String preferredLearningMode,
            String preferredSchedule,
            List<LearningRequestSummary> learningRequests
    ) {
    }
}
