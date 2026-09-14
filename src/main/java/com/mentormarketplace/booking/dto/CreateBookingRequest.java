package com.mentormarketplace.booking.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.mentormarketplace.booking.model.BookingType;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record CreateBookingRequest(
        @JsonProperty("mentee_id")
        @NotNull
        UUID menteeId,

        @JsonProperty("mentor_id")
        @NotNull
        UUID mentorId,

        @NotNull
        BookingType type,

        @JsonProperty("scheduled_time")
        Instant scheduledTime
) {
}
