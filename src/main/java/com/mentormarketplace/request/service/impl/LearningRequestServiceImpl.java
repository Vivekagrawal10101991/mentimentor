package com.mentormarketplace.request.service.impl;

import com.mentormarketplace.common.exception.BadRequestException;
import com.mentormarketplace.mentor.model.Mentor;
import com.mentormarketplace.mentor.model.MentorExpertise;
import com.mentormarketplace.mentor.repository.MentorRepository;
import com.mentormarketplace.request.dto.CreateLearningRequestRequest;
import com.mentormarketplace.request.dto.LearningRequestResponse;
import com.mentormarketplace.request.model.LearningRequest;
import com.mentormarketplace.request.repository.LearningRequestRepository;
import com.mentormarketplace.request.service.LearningRequestService;
import com.mentormarketplace.user.model.User;
import com.mentormarketplace.user.repository.UserRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LearningRequestServiceImpl implements LearningRequestService {
    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_AWAITING_CONFIRMATION = "AWAITING_CONFIRMATION";
    private static final String STATUS_ACCEPTED = "ACCEPTED";
    private static final String STATUS_REJECTED = "REJECTED";
    private static final Duration CONFIRMATION_WINDOW = Duration.ofMinutes(5);

    private final UserRepository userRepository;
    private final MentorRepository mentorRepository;
    private final LearningRequestRepository learningRequestRepository;

    public LearningRequestServiceImpl(
            UserRepository userRepository,
            MentorRepository mentorRepository,
            LearningRequestRepository learningRequestRepository
    ) {
        this.userRepository = userRepository;
        this.mentorRepository = mentorRepository;
        this.learningRequestRepository = learningRequestRepository;
    }

    @Override
    @Transactional
    public LearningRequestResponse create(UUID userId, CreateLearningRequestRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() -> new BadRequestException("User not found"));
        if ("offline".equalsIgnoreCase(request.mode())) {
            String v = request.offlineVenueType();
            if (v != null && !"AT_MENTOR".equals(v) && !"INVITE_MENTOR".equals(v)) {
                throw new BadRequestException("offlineVenueType must be AT_MENTOR or INVITE_MENTOR");
            }
        }
        LearningRequest row = new LearningRequest();
        row.setMentee(user);
        row.setCategory(request.category());
        row.setSubcategory(request.subcategory());
        row.setMode(request.mode());
        row.setScheduleType(request.scheduleType());
        row.setPreferredSchedule(request.preferredSchedule());
        row.setLocationPreference(request.locationPreference());
        row.setOfflineVenueType(request.offlineVenueType());
        row.setStatus(STATUS_PENDING);
        LearningRequest saved = learningRequestRepository.save(row);
        return toResponse(saved, "Matched by subject, location preference, availability and capability rating");
    }

    @Override
    @Transactional(readOnly = true)
    public List<LearningRequestResponse> listForMentee(UUID userId) {
        return learningRequestRepository.findByMentee_IdOrderByCreatedAtDesc(userId).stream()
                .map(r -> toResponse(r, null))
                .toList();
    }

    @Override
    @Transactional
    public List<LearningRequestResponse> listIncomingForMentor(UUID mentorUserId) {
        Mentor mentor = mentorRepository.findByUserIdWithExpertise(mentorUserId)
                .orElseThrow(() -> new BadRequestException("Mentor profile not found"));

        releaseExpiredConfirmations();

        List<LearningRequest> pending = learningRequestRepository.findByStatusOrderByCreatedAtDesc(STATUS_PENDING);
        List<LearningRequest> awaiting = learningRequestRepository
                .findByStatusOrderByCreatedAtDesc(STATUS_AWAITING_CONFIRMATION)
                .stream()
                .filter(r -> r.getAssignedMentor() != null && r.getAssignedMentor().getId().equals(mentor.getId()))
                .toList();

        List<LearningRequest> combined = new ArrayList<>();
        combined.addAll(awaiting);
        combined.addAll(pending);

        return combined.stream()
                .filter(r -> !r.getMentee().getId().equals(mentorUserId))
                .filter(r -> matchesMentorExpertise(mentor, r))
                .filter(r -> r.getAssignedMentor() == null || r.getAssignedMentor().getId().equals(mentor.getId()))
                .map(r -> toResponse(r, null))
                .toList();
    }

    @Override
    @Transactional
    public LearningRequestResponse acceptForMentor(UUID mentorUserId, UUID requestId) {
        Mentor mentor = mentorRepository.findByUserIdWithExpertise(mentorUserId)
                .orElseThrow(() -> new BadRequestException("Mentor profile not found"));
        LearningRequest request = learningRequestRepository.findById(requestId)
                .orElseThrow(() -> new BadRequestException("Learning request not found"));

        releaseIfExpired(request);

        if (!STATUS_PENDING.equals(request.getStatus())) {
            throw new BadRequestException("Only pending requests can be accepted");
        }
        if (request.getMentee().getId().equals(mentorUserId)) {
            throw new BadRequestException("You cannot respond to your own request");
        }
        if (!matchesMentorExpertise(mentor, request)) {
            throw new BadRequestException("Request does not match your expertise");
        }
        if (request.getAssignedMentor() != null && !request.getAssignedMentor().getId().equals(mentor.getId())) {
            throw new BadRequestException("This request has already been handled by another mentor");
        }

        request.setAssignedMentor(mentor);
        request.setStatus(STATUS_AWAITING_CONFIRMATION);
        request.setConfirmationExpiresAt(Instant.now().plus(CONFIRMATION_WINDOW));
        LearningRequest saved = learningRequestRepository.save(request);
        return toResponse(saved, "Confirm within 5 minutes or the request will be released to other mentors");
    }

    @Override
    @Transactional
    public LearningRequestResponse rejectForMentor(UUID mentorUserId, UUID requestId) {
        return updateMentorDecision(mentorUserId, requestId, STATUS_REJECTED);
    }

    @Override
    @Transactional
    public LearningRequestResponse confirmForMentor(UUID mentorUserId, UUID requestId) {
        Mentor mentor = mentorRepository.findByUserIdWithExpertise(mentorUserId)
                .orElseThrow(() -> new BadRequestException("Mentor profile not found"));
        LearningRequest request = learningRequestRepository.findById(requestId)
                .orElseThrow(() -> new BadRequestException("Learning request not found"));

        releaseIfExpired(request);

        if (!STATUS_AWAITING_CONFIRMATION.equals(request.getStatus())) {
            throw new BadRequestException("Only requests awaiting confirmation can be confirmed");
        }
        if (request.getAssignedMentor() == null || !request.getAssignedMentor().getId().equals(mentor.getId())) {
            throw new BadRequestException("This confirmation window belongs to another mentor");
        }

        request.setStatus(STATUS_ACCEPTED);
        request.setConfirmationExpiresAt(null);
        LearningRequest saved = learningRequestRepository.save(request);
        return toResponse(saved, "Session confirmed");
    }

    private LearningRequestResponse updateMentorDecision(UUID mentorUserId, UUID requestId, String targetStatus) {
        Mentor mentor = mentorRepository.findByUserIdWithExpertise(mentorUserId)
                .orElseThrow(() -> new BadRequestException("Mentor profile not found"));
        LearningRequest request = learningRequestRepository.findById(requestId)
                .orElseThrow(() -> new BadRequestException("Learning request not found"));

        releaseIfExpired(request);

        if (!STATUS_PENDING.equals(request.getStatus()) && !STATUS_AWAITING_CONFIRMATION.equals(request.getStatus())) {
            throw new BadRequestException("Only pending or awaiting-confirmation requests can be updated");
        }
        if (request.getMentee().getId().equals(mentorUserId)) {
            throw new BadRequestException("You cannot respond to your own request");
        }
        if (!matchesMentorExpertise(mentor, request)) {
            throw new BadRequestException("Request does not match your expertise");
        }
        if (request.getAssignedMentor() != null && !request.getAssignedMentor().getId().equals(mentor.getId())) {
            throw new BadRequestException("This request has already been handled by another mentor");
        }

        request.setAssignedMentor(mentor);
        request.setStatus(targetStatus);
        request.setConfirmationExpiresAt(null);
        LearningRequest saved = learningRequestRepository.save(request);
        return toResponse(saved, null);
    }

    private void releaseExpiredConfirmations() {
        Instant now = Instant.now();
        learningRequestRepository.findByStatusOrderByCreatedAtDesc(STATUS_AWAITING_CONFIRMATION).forEach(request -> {
            if (request.getConfirmationExpiresAt() != null && request.getConfirmationExpiresAt().isBefore(now)) {
                request.setStatus(STATUS_PENDING);
                request.setAssignedMentor(null);
                request.setConfirmationExpiresAt(null);
                learningRequestRepository.save(request);
            }
        });
    }

    private void releaseIfExpired(LearningRequest request) {
        if (STATUS_AWAITING_CONFIRMATION.equals(request.getStatus())
                && request.getConfirmationExpiresAt() != null
                && request.getConfirmationExpiresAt().isBefore(Instant.now())) {
            request.setStatus(STATUS_PENDING);
            request.setAssignedMentor(null);
            request.setConfirmationExpiresAt(null);
            learningRequestRepository.save(request);
        }
    }

    private static boolean matchesMentorExpertise(Mentor mentor, LearningRequest request) {
        if (mentor.getExpertise() == null || mentor.getExpertise().isEmpty()) {
            return false;
        }
        return mentor.getExpertise().stream()
                .anyMatch(e -> matchesExpertise(e, request.getCategory(), request.getSubcategory()));
    }

    private static boolean matchesExpertise(MentorExpertise expertise, String category, String subcategory) {
        return expertise != null
                && expertise.getCategory() != null
                && expertise.getSubcategory() != null
                && expertise.getCategory().equalsIgnoreCase(category)
                && expertise.getSubcategory().equalsIgnoreCase(subcategory);
    }

    private static LearningRequestResponse toResponse(LearningRequest saved, String matchingNote) {
        Long remaining = null;
        if (saved.getConfirmationExpiresAt() != null
                && STATUS_AWAITING_CONFIRMATION.equals(saved.getStatus())) {
            long secs = Duration.between(Instant.now(), saved.getConfirmationExpiresAt()).getSeconds();
            remaining = Math.max(0, secs);
        }
        return new LearningRequestResponse(
                saved.getId(),
                saved.getMentee().getId(),
                saved.getCategory(),
                saved.getSubcategory(),
                saved.getMode(),
                saved.getScheduleType(),
                saved.getPreferredSchedule(),
                saved.getLocationPreference(),
                saved.getOfflineVenueType(),
                saved.getStatus(),
                matchingNote != null ? matchingNote : "",
                saved.getConfirmationExpiresAt(),
                remaining
        );
    }
}
