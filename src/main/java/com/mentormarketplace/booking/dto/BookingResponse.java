package com.mentormarketplace.booking.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.mentormarketplace.booking.model.BookingStatus;
import com.mentormarketplace.booking.model.BookingType;
import java.time.Instant;
import java.util.UUID;

public record BookingResponse(
        UUID id,
        @JsonProperty("mentee_id")
        UUID menteeId,
        @JsonProperty("mentor_id")
        UUID mentorId,
        BookingType type,
        @JsonProperty("scheduled_time")
        Instant scheduledTime,
        @JsonProperty("start_time")
        Instant startTime,
        BookingStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}
