package com.mentormarketplace.user.dto.contract;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record UpsertInterestsRequest(
        @NotEmpty List<InterestInput> interests
) {
}
