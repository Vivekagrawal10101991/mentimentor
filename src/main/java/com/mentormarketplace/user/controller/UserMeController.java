package com.mentormarketplace.user.controller;

import com.mentormarketplace.user.dto.contract.InterestsEnvelope;
import com.mentormarketplace.user.dto.contract.UpdateUserProfileRequest;
import com.mentormarketplace.user.dto.contract.UpsertInterestsRequest;
import com.mentormarketplace.user.dto.contract.UserProfileEnvelope;
import com.mentormarketplace.user.service.AccountDeletionService;
import com.mentormarketplace.user.service.UserProfileService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/users/me")
public class UserMeController {

    private final UserProfileService userProfileService;
    private final AccountDeletionService accountDeletionService;

    public UserMeController(UserProfileService userProfileService, AccountDeletionService accountDeletionService) {
        this.userProfileService = userProfileService;
        this.accountDeletionService = accountDeletionService;
    }

    @GetMapping
    public ResponseEntity<UserProfileEnvelope> getMyProfile() {
        return ResponseEntity.ok(userProfileService.getMyProfile(currentUserId()));
    }

    @PatchMapping
    public ResponseEntity<UserProfileEnvelope> updateMyProfile(@Valid @RequestBody UpdateUserProfileRequest request) {
        return ResponseEntity.ok(userProfileService.updateMyProfile(currentUserId(), request));
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteMyAccount() {
        accountDeletionService.deleteMyAccount(currentUserId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/interests")
    public ResponseEntity<InterestsEnvelope> upsertInterests(@Valid @RequestBody UpsertInterestsRequest request) {
        return ResponseEntity.ok(userProfileService.upsertInterests(currentUserId(), request));
    }

    private static UUID currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UUID id)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        return id;
    }
}
