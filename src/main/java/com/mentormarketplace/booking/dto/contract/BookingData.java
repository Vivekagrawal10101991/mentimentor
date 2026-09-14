package com.mentormarketplace.booking.dto.contract;

import java.time.Instant;
import java.util.UUID;

public record BookingData(
        UUID bookingId,
        UUID menteeId,
        UUID mentorId,
        UUID packageId,
        String bookingType,
        String sessionMode,
        String status,
        Instant startTime,
        Instant endTime,
        PricingBreakdownData pricing,
        Instant sessionStartOtpIssuedAt,
        Instant sessionStartOtpExpiresAt,
        Instant createdAt,
        Instant updatedAt
) {
}
