package com.mentormarketplace.parent.dto;

import java.time.Instant;
import java.util.UUID;

public record ParentOtpResponse(
        UUID otpRequestId,
        Instant expiresAt
) {
}
