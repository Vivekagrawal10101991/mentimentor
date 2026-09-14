package com.mentormarketplace.auth.dto;

import java.time.Instant;
import java.util.UUID;

public record SendOtpResponse(
        UUID otpRequestId,
        Instant expiresAt,
        long resendAfterSeconds,
        OtpDeliveryHint deliveryHint
) {
}

