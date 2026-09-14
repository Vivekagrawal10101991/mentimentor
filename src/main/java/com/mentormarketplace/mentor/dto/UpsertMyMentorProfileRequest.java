package com.mentormarketplace.mentor.dto;

import com.mentormarketplace.user.dto.contract.LocationInput;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public record UpsertMyMentorProfileRequest(
        @NotEmpty List<@NotNull ExpertiseRequest> expertise,
        @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal hourlyRate,
        @NotEmpty List<@NotBlank String> languages,
        @Size(max = 4000) String experienceDetails,
        @Size(max = 512) String linkedinProfile,
        @Valid LocationInput serviceArea
) {
}
