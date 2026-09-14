package com.mentormarketplace.booking.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.mentormarketplace.booking.model.BookingStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record EndBookingResponse(
        @JsonProperty("booking_id")
        UUID bookingId,
        @JsonProperty("end_time")
        Instant endTime,
        @JsonProperty("duration_seconds")
        long durationSeconds,
        @JsonProperty("mentor_hourly_rate")
        BigDecimal mentorHourlyRate,
        @JsonProperty("total_amount")
        BigDecimal totalAmount,
        @JsonProperty("payment_id")
        UUID paymentId,
        @JsonProperty("currency")
        String currency,
        BookingStatus status
) {
}
