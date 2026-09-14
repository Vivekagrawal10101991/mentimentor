package com.mentormarketplace.payment.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PaymentInitiateRequest(
        @JsonProperty("booking_id")
        @NotNull
        UUID bookingId
) {
}
