package com.mentormarketplace.request.service;

import com.mentormarketplace.request.dto.CreateLearningRequestRequest;
import com.mentormarketplace.request.dto.LearningRequestResponse;
import java.util.List;
import java.util.UUID;

public interface LearningRequestService {
    LearningRequestResponse create(UUID userId, CreateLearningRequestRequest request);

    List<LearningRequestResponse> listForMentee(UUID userId);

    List<LearningRequestResponse> listIncomingForMentor(UUID mentorUserId);

    LearningRequestResponse acceptForMentor(UUID mentorUserId, UUID requestId);

    LearningRequestResponse rejectForMentor(UUID mentorUserId, UUID requestId);

    LearningRequestResponse confirmForMentor(UUID mentorUserId, UUID requestId);
}
