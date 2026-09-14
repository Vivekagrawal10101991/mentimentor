package com.mentormarketplace.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PaymentConfirmRequest(
        @NotNull
        UUID paymentId,
        @NotBlank
        String providerTransactionId
) {
}
