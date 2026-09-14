package com.mentormarketplace.mentor.service;

import com.mentormarketplace.mentor.dto.onboarding.MentorOnboardingSaveRequest;
import com.mentormarketplace.mentor.dto.onboarding.MentorOnboardingStatusResponse;
import java.util.UUID;

public interface MentorOnboardingService {
    MentorOnboardingStatusResponse getStatus(UUID userId);

    MentorOnboardingStatusResponse saveProgress(UUID userId, MentorOnboardingSaveRequest request);
}
