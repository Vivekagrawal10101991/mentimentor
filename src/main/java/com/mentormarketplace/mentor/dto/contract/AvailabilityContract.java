package com.mentormarketplace.mentor.dto.contract;

import java.time.Instant;
import java.util.UUID;

public record AvailabilityContract(
        UUID slotId,
        Instant startTime,
        Instant endTime,
        String timezone,
        String recurrenceRule
) {
}
