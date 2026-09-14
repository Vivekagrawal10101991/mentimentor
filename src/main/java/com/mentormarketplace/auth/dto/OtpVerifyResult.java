package com.mentormarketplace.auth.dto;

import com.mentormarketplace.user.model.User;

public record OtpVerifyResult(
        User user,
        String accessToken,
        String refreshToken,
        long expiresInSeconds
) {
}
