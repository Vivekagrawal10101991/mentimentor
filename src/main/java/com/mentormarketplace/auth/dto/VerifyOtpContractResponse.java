package com.mentormarketplace.auth.dto;

public record VerifyOtpContractResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        UserSummary user
) {
}
