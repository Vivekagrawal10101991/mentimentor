package com.mentormarketplace.booking.dto.contract;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record SessionStartData(
        UUID bookingId,
        String status,
        List<String> otpValidatedBy,
        boolean sessionStarted,
        Instant startedAt
) {
}
