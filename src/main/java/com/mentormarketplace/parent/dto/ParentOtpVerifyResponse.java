package com.mentormarketplace.parent.dto;

import java.util.UUID;

public record ParentOtpVerifyResponse(
        UUID parentDetailsId,
        String kycStatus
) {
}
