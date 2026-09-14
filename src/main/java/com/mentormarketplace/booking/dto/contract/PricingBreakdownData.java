package com.mentormarketplace.booking.dto.contract;

public record PricingBreakdownData(
        int grossAmount,
        int discountAmount,
        int payableAmount,
        String currency
) {
}
