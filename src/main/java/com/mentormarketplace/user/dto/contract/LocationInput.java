package com.mentormarketplace.user.dto.contract;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record LocationInput(
        @NotBlank @Size(min = 1, max = 64) String city,
        @Size(max = 64) String state,
        @NotBlank @Size(min = 2, max = 2) @Pattern(regexp = "^[A-Z]{2}$") String country,
        Double lat,
        Double lng,
        /** Optional; stored normalized for offline mentor search (e.g. 6-digit PIN in India). */
        @Size(max = 16) String pinCode
) {
}
