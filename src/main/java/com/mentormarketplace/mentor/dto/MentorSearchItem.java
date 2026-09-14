package com.mentormarketplace.mentor.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record MentorSearchItem(
        UUID mentorId,
        BigDecimal rating,
        BigDecimal hourlyRate,
        List<ExpertiseRequest> expertise,
        List<String> languages,
        boolean available,
        Double distanceMeters,
        String approximateLocation
) {
}

