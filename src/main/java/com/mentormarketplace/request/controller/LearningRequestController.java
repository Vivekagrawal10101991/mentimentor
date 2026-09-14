package com.mentormarketplace.request.controller;

import com.mentormarketplace.request.dto.CreateLearningRequestRequest;
import com.mentormarketplace.request.dto.LearningRequestResponse;
import com.mentormarketplace.request.service.LearningRequestService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/requests")
public class LearningRequestController {
    private final LearningRequestService learningRequestService;

    public LearningRequestController(LearningRequestService learningRequestService) {
        this.learningRequestService = learningRequestService;
    }

    @PostMapping("/create")
    public ResponseEntity<LearningRequestResponse> create(@Valid @RequestBody CreateLearningRequestRequest request) {
        return ResponseEntity.ok(learningRequestService.create(currentUserId(), request));
    }

    @GetMapping("/me")
    public ResponseEntity<List<LearningRequestResponse>> listMine() {
        return ResponseEntity.ok(learningRequestService.listForMentee(currentUserId()));
    }

    @GetMapping("/mentor/incoming")
    public ResponseEntity<List<LearningRequestResponse>> listIncomingForMentor() {
        return ResponseEntity.ok(learningRequestService.listIncomingForMentor(currentUserId()));
    }

    @PostMapping("/{requestId}/mentor/accept")
    public ResponseEntity<LearningRequestResponse> acceptForMentor(@PathVariable UUID requestId) {
        return ResponseEntity.ok(learningRequestService.acceptForMentor(currentUserId(), requestId));
    }

    @PostMapping("/{requestId}/mentor/reject")
    public ResponseEntity<LearningRequestResponse> rejectForMentor(@PathVariable UUID requestId) {
        return ResponseEntity.ok(learningRequestService.rejectForMentor(currentUserId(), requestId));
    }

    @PostMapping("/{requestId}/mentor/confirm")
    public ResponseEntity<LearningRequestResponse> confirmForMentor(@PathVariable UUID requestId) {
        return ResponseEntity.ok(learningRequestService.confirmForMentor(currentUserId(), requestId));
    }

    private static UUID currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UUID id)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return id;
    }
}
