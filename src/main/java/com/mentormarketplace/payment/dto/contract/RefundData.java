package com.mentormarketplace.payment.dto.contract;

import java.time.Instant;
import java.util.UUID;

public record RefundData(
        UUID refundId,
        UUID paymentId,
        int amount,
        String currency,
        String reason,
        String status,
        Instant createdAt
) {
}
