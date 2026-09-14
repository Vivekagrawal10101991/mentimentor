package com.mentormarketplace.mentor.controller;

import com.mentormarketplace.mentor.dto.CreateMentorProfileRequest;
import com.mentormarketplace.mentor.dto.MentorProfileResponse;
import com.mentormarketplace.mentor.dto.UpsertMyMentorProfileRequest;
import com.mentormarketplace.mentor.dto.contract.MentorProfileEnvelope;
import com.mentormarketplace.mentor.service.MentorService;
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
@RequestMapping("/mentors/me")
public class MentorMeController {

    private final MentorService mentorService;

    public MentorMeController(MentorService mentorService) {
        this.mentorService = mentorService;
    }

    @GetMapping("/profile")
    public ResponseEntity<MentorProfileEnvelope> getMyMentorProfile() {
        return ResponseEntity.ok(mentorService.getMyMentorProfileContract(currentUserId()));
    }

    @PostMapping("/profile")
    public ResponseEntity<MentorProfileResponse> upsertMyMentorProfile(
            @Valid @RequestBody UpsertMyMentorProfileRequest request
    ) {
        UUID uid = currentUserId();
        CreateMentorProfileRequest body = new CreateMentorProfileRequest(
                uid,
                request.expertise(),
                request.hourlyRate(),
                request.languages(),
                request.experienceDetails(),
                request.linkedinProfile(),
                request.serviceArea()
        );
        return ResponseEntity.ok(mentorService.createOrUpdateProfile(body));
    }

    private static UUID currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UUID id)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return id;
    }
}
