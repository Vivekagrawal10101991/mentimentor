package com.mentormarketplace.user.service.impl;

import com.mentormarketplace.mentor.model.Mentor;
import com.mentormarketplace.mentor.repository.MentorRepository;
import com.mentormarketplace.request.model.LearningRequest;
import com.mentormarketplace.request.repository.LearningRequestRepository;
import com.mentormarketplace.user.dto.dashboard.LearningRequestSummary;
import com.mentormarketplace.user.dto.dashboard.UserDashboardResponse;
import com.mentormarketplace.user.model.User;
import com.mentormarketplace.user.model.UserProfile;
import com.mentormarketplace.user.repository.UserProfileRepository;
import com.mentormarketplace.user.repository.UserRepository;
import com.mentormarketplace.user.service.UserDashboardService;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class UserDashboardServiceImpl implements UserDashboardService {
    private final UserRepository userRepository;
    private final MentorRepository mentorRepository;
    private final UserProfileRepository userProfileRepository;
    private final LearningRequestRepository learningRequestRepository;

    public UserDashboardServiceImpl(
            UserRepository userRepository,
            MentorRepository mentorRepository,
            UserProfileRepository userProfileRepository,
            LearningRequestRepository learningRequestRepository
    ) {
        this.userRepository = userRepository;
        this.mentorRepository = mentorRepository;
        this.userProfileRepository = userProfileRepository;
        this.learningRequestRepository = learningRequestRepository;
    }

    @Override
    public UserDashboardResponse getDashboard(UUID userId) {
        User user = userRepository.findById(userId).orElseThrow();
        Mentor mentor = mentorRepository.findByUserIdWithExpertise(userId).orElse(null);
        UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);

        List<String> skillSummaries = mentor == null || mentor.getExpertise() == null
                ? List.of()
                : mentor.getExpertise().stream()
                        .map(e -> e.getCategory() + " · " + e.getSubcategory())
                        .toList();

        UserDashboardResponse.MentorDashboardData mentorData = mentor == null ? null : new UserDashboardResponse.MentorDashboardData(
                mentor.getId(),
                mentor.getRecommendedHourlyRate() != null ? mentor.getRecommendedHourlyRate() : mentor.getHourlyRate(),
                mentor.getExperienceDetails(),
                mentor.getLinkedinProfile(),
                mentor.getTestStatus().name(),
                skillSummaries,
                0,
                mentor.getRating(),
                mentor.getKnowledgeRating(),
                mentor.getPedagogyRating(),
                mentor.getVerificationStatus(),
                mentor.getProfileCompletenessPercent(),
                mentor.getOnboardingStatus()
        );

        List<LearningRequestSummary> learningRequests = learningRequestRepository
                .findByMentee_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(UserDashboardServiceImpl::toLearningSummary)
                .toList();

        UserDashboardResponse.MenteeDashboardData menteeData = new UserDashboardResponse.MenteeDashboardData(
                user.getId(),
                user.getAge(),
                user.isMinor(),
                profile == null ? null : profile.getPreferredLearningMode(),
                profile == null ? null : profile.getPreferredSchedule(),
                learningRequests
        );

        return new UserDashboardResponse(
                mentorData,
                menteeData,
                mentor != null && mentor.getRecommendedHourlyRate() != null
                        ? mentor.getRecommendedHourlyRate()
                        : BigDecimal.ZERO,
                List.of()
        );
    }

    private static LearningRequestSummary toLearningSummary(LearningRequest r) {
        return new LearningRequestSummary(
                r.getId(),
                r.getCategory(),
                r.getSubcategory(),
                r.getMode(),
                r.getScheduleType(),
                r.getStatus(),
                r.getCreatedAt()
        );
    }
}
