package com.mentormarketplace.payment.dto.contract;

public record CommissionBreakdownData(
        float takeRatePercent,
        int platformAmount,
        int mentorAmount
) {
}
