package com.mentormarketplace.booking.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record StartBookingRequest(
        @JsonProperty("booking_id")
        @NotNull
        UUID bookingId,

        @JsonProperty("mentor_id")
        @NotNull
        UUID mentorId,

        @NotBlank
        String otp
) {
}
