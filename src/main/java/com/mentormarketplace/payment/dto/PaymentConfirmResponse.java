package com.mentormarketplace.payment.dto;

import com.mentormarketplace.booking.model.PaymentStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PaymentConfirmResponse(
        UUID paymentId,
        String paymentReference,
        String providerTransactionId,
        PaymentStatus status,
        BigDecimal mentorWalletBalance,
        Instant confirmedAt
) {
}
