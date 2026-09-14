package com.mentormarketplace.user.service;

import com.mentormarketplace.user.dto.CreateUserProfileRequest;
import com.mentormarketplace.user.dto.UserProfileResponse;
import com.mentormarketplace.user.dto.contract.InterestsEnvelope;
import com.mentormarketplace.user.dto.contract.UpdateUserProfileRequest;
import com.mentormarketplace.user.dto.contract.UpsertInterestsRequest;
import com.mentormarketplace.user.dto.contract.UserProfileEnvelope;
import java.util.UUID;

public interface UserProfileService {

    UserProfileResponse createOrUpdateProfile(CreateUserProfileRequest request);

    UserProfileEnvelope getMyProfile(UUID userId);

    UserProfileEnvelope updateMyProfile(UUID userId, UpdateUserProfileRequest request);

    InterestsEnvelope upsertInterests(UUID userId, UpsertInterestsRequest request);
}
