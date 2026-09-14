package com.mentormarketplace.mentor.controller;

import com.mentormarketplace.mentor.availability.dto.MentorAvailabilityRequest;
import com.mentormarketplace.mentor.availability.dto.MentorAvailabilityResponse;
import com.mentormarketplace.mentor.dto.CreateMentorProfileRequest;
import com.mentormarketplace.mentor.dto.MentorProfileResponse;
import com.mentormarketplace.mentor.dto.MentorSearchResponse;
import com.mentormarketplace.mentor.dto.contract.MentorDetailEnvelope;
import com.mentormarketplace.mentor.service.MentorService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/mentors")
public class MentorController {

    private final MentorService mentorService;

    public MentorController(MentorService mentorService) {
        this.mentorService = mentorService;
    }

    @PostMapping("/profile")
    public ResponseEntity<MentorProfileResponse> createMentorProfile(
            @Valid @RequestBody CreateMentorProfileRequest request
    ) {
        return ResponseEntity.ok(mentorService.createOrUpdateProfile(request));
    }

    @PostMapping("/availability")
    public ResponseEntity<MentorAvailabilityResponse> updateAvailability(
            @Valid @RequestBody MentorAvailabilityRequest request
    ) {
        return ResponseEntity.ok(mentorService.updateAvailability(request));
    }

    @GetMapping("/available")
    public ResponseEntity<List<MentorAvailabilityResponse>> getAvailableMentors() {
        return ResponseEntity.ok(mentorService.getAvailableMentors());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MentorDetailEnvelope> getMentor(@PathVariable UUID id) {
        return ResponseEntity.ok(mentorService.getMentorById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<MentorSearchResponse> searchMentors(
            @RequestParam String category,
            @RequestParam String subcategory,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(required = false) String pinCode,
            @RequestParam(defaultValue = "online") String matchMode,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize
    ) {
        return ResponseEntity.ok(
                mentorService.searchMentors(category, subcategory, radiusKm, pinCode, matchMode, page, pageSize)
        );
    }
}
