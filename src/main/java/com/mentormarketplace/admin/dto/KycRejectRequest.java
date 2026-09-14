package com.mentormarketplace.admin.dto;

import jakarta.validation.constraints.Size;

public record KycRejectRequest(@Size(max = 500) String reason) {
}
