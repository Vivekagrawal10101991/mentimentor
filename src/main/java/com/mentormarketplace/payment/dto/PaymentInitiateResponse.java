package com.mentormarketplace.payment.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.mentormarketplace.booking.model.PaymentStatus;
import java.math.BigDecimal;
import java.util.UUID;

public record PaymentInitiateResponse(
        UUID paymentId,
        @JsonProperty("booking_id")
        UUID bookingId,
        String paymentReference,
        BigDecimal amount,
        BigDecimal platformFeePercent,
        BigDecimal platformFeeAmount,
        BigDecimal mentorAmount,
        PaymentStatus status
) {
}
