package com.mentormarketplace.booking.dto.contract;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public record CreateBookingContractRequest(
        @NotNull UUID mentorId,
        @NotNull UUID packageId,
        @NotBlank String bookingType,
        Instant scheduledStartTime,
        @NotBlank String sessionMode,
        @Size(max = 500) String notes
) {
}
