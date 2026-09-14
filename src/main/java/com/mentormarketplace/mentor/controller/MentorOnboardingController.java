package com.mentormarketplace.mentor.controller;

import com.mentormarketplace.mentor.dto.onboarding.MentorOnboardingSaveRequest;
import com.mentormarketplace.mentor.dto.onboarding.MentorOnboardingStatusResponse;
import com.mentormarketplace.mentor.service.MentorOnboardingService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/mentors/me/onboarding")
public class MentorOnboardingController {

    private final MentorOnboardingService mentorOnboardingService;

    public MentorOnboardingController(MentorOnboardingService mentorOnboardingService) {
        this.mentorOnboardingService = mentorOnboardingService;
    }

    @GetMapping
    public ResponseEntity<MentorOnboardingStatusResponse> getStatus() {
        return ResponseEntity.ok(mentorOnboardingService.getStatus(currentUserId()));
    }

    @PostMapping
    public ResponseEntity<MentorOnboardingStatusResponse> saveProgress(
            @Valid @RequestBody MentorOnboardingSaveRequest request
    ) {
        return ResponseEntity.ok(mentorOnboardingService.saveProgress(currentUserId(), request));
    }

    private static UUID currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UUID id)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return id;
    }
}
