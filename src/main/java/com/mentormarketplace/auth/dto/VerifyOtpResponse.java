package com.mentormarketplace.auth.dto;

import com.mentormarketplace.user.dto.UserProfileDto;

public record VerifyOtpResponse(
        UserProfileDto user
) {
}

