package com.mentormarketplace.parent.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record SendParentOtpRequest(
        @NotNull UUID parentDetailsId
) {
}
