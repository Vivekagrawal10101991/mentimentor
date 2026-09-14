package com.mentormarketplace.user.controller;

import com.mentormarketplace.user.dto.CreateUserProfileRequest;
import com.mentormarketplace.user.dto.UserProfileResponse;
import com.mentormarketplace.user.service.UserProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
public class UserProfileController {

    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @PostMapping("/profile")
    public ResponseEntity<UserProfileResponse> createUserProfile(
            @Valid @RequestBody CreateUserProfileRequest request
    ) {
        return ResponseEntity.ok(userProfileService.createOrUpdateProfile(request));
    }
}
