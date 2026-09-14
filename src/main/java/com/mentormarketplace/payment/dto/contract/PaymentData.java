package com.mentormarketplace.payment.dto.contract;

import java.time.Instant;
import java.util.UUID;

public record PaymentData(
        UUID paymentId,
        UUID bookingId,
        UUID payerUserId,
        int amount,
        String currency,
        String status,
        String provider,
        String providerReference,
        CommissionBreakdownData commission,
        Instant createdAt,
        Instant updatedAt
) {
}
