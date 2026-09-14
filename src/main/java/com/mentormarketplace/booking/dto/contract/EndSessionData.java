package com.mentormarketplace.booking.dto.contract;

import java.time.Instant;
import java.util.UUID;

public record EndSessionData(
        UUID bookingId,
        String status,
        Instant endedAt,
        int billedAmount,
        String currency
) {
}
